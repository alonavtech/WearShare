from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .. import events
from ..auth import get_current_user
from ..db import get_db
from ..models import BorrowRequest, Item, User
from ..permissions import can_see_item
from ..schemas import BorrowIn, BorrowOut, DecisionIn
from ..serializers import borrow_out
from ..services import system_message
from ..timeutil import earliest_start

router = APIRouter(prefix="/api/borrow-requests", tags=["borrowing"])
CARE = {"wash": "Wash before returning", "owner": "Return as is, owner washes", "dry": "Dry clean only"}


def _overlapping_approved(db: Session, item_id: int, start, end, exclude_id: int | None = None):
    stmt = select(BorrowRequest).where(
        BorrowRequest.item_id == item_id, BorrowRequest.status == "approved",
        BorrowRequest.start_date <= end, BorrowRequest.end_date >= start)
    if exclude_id:
        stmt = stmt.where(BorrowRequest.id != exclude_id)
    return db.scalars(stmt).all()


@router.post("", response_model=BorrowOut, status_code=201)
def create_request(body: BorrowIn, me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.get(Item, body.item_id)
    if not item or not can_see_item(db, me.id, item):
        raise HTTPException(404, "Item not found.")
    if item.owner_id == me.id:
        raise HTTPException(400, "You can't borrow your own item.")
    if body.start_date < earliest_start():
        raise HTTPException(400, "Requests must be sent at least 24 hours before the start date.")
    if body.start_date < item.available_from or body.end_date > item.available_until:
        raise HTTPException(400, "Those dates are outside when the owner lends this item.")
    if _overlapping_approved(db, item.id, body.start_date, body.end_date):
        raise HTTPException(409, "Some of those dates are already booked.")
    dup = db.scalar(select(BorrowRequest.id).where(
        BorrowRequest.item_id == item.id, BorrowRequest.borrower_id == me.id, BorrowRequest.status == "pending",
        BorrowRequest.start_date <= body.end_date, BorrowRequest.end_date >= body.start_date))
    if dup:
        raise HTTPException(409, "You already have a pending request for these dates.")
    # Pending requests do NOT reserve the item; only approval does.
    r = BorrowRequest(item_id=item.id, borrower_id=me.id, owner_id=item.owner_id,
                      start_date=body.start_date, end_date=body.end_date)
    db.add(r)
    db.commit()
    db.refresh(r)
    events.record("request_submitted", me.id, item.id)
    return borrow_out(db, r, me.id)


@router.get("", response_model=dict[str, list[BorrowOut]])
def my_requests(me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sent = db.scalars(select(BorrowRequest).where(BorrowRequest.borrower_id == me.id).order_by(BorrowRequest.created_at.desc()))
    received = db.scalars(select(BorrowRequest).where(BorrowRequest.owner_id == me.id).order_by(BorrowRequest.created_at.desc()))
    return {"sent": [borrow_out(db, r, me.id) for r in sent], "received": [borrow_out(db, r, me.id) for r in received]}


@router.patch("/{req_id}/decision", response_model=BorrowOut)
def decide(req_id: int, body: DecisionIn, me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    r = db.get(BorrowRequest, req_id)
    if not r or r.owner_id != me.id:
        raise HTTPException(404, "Request not found.")
    if r.status != "pending":
        raise HTTPException(409, "This request has already been answered.")
    item = db.get(Item, r.item_id)

    if not body.approve:
        r.status, r.decided_at = "declined", datetime.now(timezone.utc)
        system_message(db, r.owner_id, r.borrower_id, f"Request declined: {item.title}, {r.start_date} to {r.end_date}.")
        db.commit()
        return borrow_out(db, r, me.id)

    # Lock the item row so two approvals can't race (no-op on SQLite, real lock on Postgres).
    db.execute(select(Item).where(Item.id == item.id).with_for_update())
    if _overlapping_approved(db, item.id, r.start_date, r.end_date, exclude_id=r.id):
        db.rollback()
        # Failed approval leaves the request unchanged and tells the owner why.
        raise HTTPException(409, "Those dates are no longer available.")
    r.status, r.decided_at = "approved", datetime.now(timezone.utc)
    system_message(db, r.owner_id, r.borrower_id,
                   f"Request approved: {item.title}, {r.start_date} to {r.end_date}. Care: {CARE.get(item.care, item.care)}.")
    # Recheck other pending requests: overlapping ones can no longer be approved.
    for other in db.scalars(select(BorrowRequest).where(
            BorrowRequest.item_id == item.id, BorrowRequest.status == "pending", BorrowRequest.id != r.id,
            BorrowRequest.start_date <= r.end_date, BorrowRequest.end_date >= r.start_date)):
        other.status = "declined"
        other.note = "Someone else was approved for overlapping dates. Pick new dates and request again."
        system_message(db, other.owner_id, other.borrower_id,
                       f"{item.title}: your dates overlapped with an approved booking. Try different dates.")
    try:
        db.commit()
    except IntegrityError:  # the Postgres exclusion constraint caught a race
        db.rollback()
        raise HTTPException(409, "Those dates are no longer available.")
    events.record("request_approved", me.id, item.id)
    return borrow_out(db, r, me.id)


@router.post("/{req_id}/cancel", response_model=BorrowOut)
def cancel(req_id: int, me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    r = db.get(BorrowRequest, req_id)
    if not r or me.id not in (r.owner_id, r.borrower_id):
        raise HTTPException(404, "Request not found.")
    if r.status not in ("pending", "approved"):
        raise HTTPException(409, "Only pending or approved requests can be canceled.")
    was_approved = r.status == "approved"
    r.status = "canceled"
    if was_approved:
        item = db.get(Item, r.item_id)
        system_message(db, r.owner_id, r.borrower_id, f"Booking canceled: {item.title}, {r.start_date} to {r.end_date}. Dates released.")
    db.commit()
    return borrow_out(db, r, me.id)


@router.post("/{req_id}/returned", response_model=BorrowOut)
def mark_returned(req_id: int, me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    r = db.get(BorrowRequest, req_id)
    if not r or r.owner_id != me.id:
        raise HTTPException(404, "Request not found.")
    if r.status != "approved":
        raise HTTPException(409, "Only approved borrows can be marked returned.")
    r.status = "returned"
    system_message(db, r.owner_id, r.borrower_id, f"{db.get(Item, r.item_id).title} was marked as returned. Thanks!")
    db.commit()
    events.record("exchange_returned", me.id, r.item_id)
    return borrow_out(db, r, me.id)
