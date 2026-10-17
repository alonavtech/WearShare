from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import BorrowRequest, Item, ItemShare, User
from .schemas import BorrowOut, ItemOut, UserOut
from .storage import signed_url
from .timeutil import today


def user_out(u: User) -> UserOut:
    return UserOut.model_validate(u)


def status_label(db: Session, item: Item) -> str:
    t = today()
    reqs = db.scalars(select(BorrowRequest).where(
        BorrowRequest.item_id == item.id, BorrowRequest.status.in_(["pending", "approved"]))).all()
    approved = [r for r in reqs if r.status == "approved"]
    if any(r.end_date < t for r in approved):
        return "overdue"
    if any(r.start_date <= t <= r.end_date for r in approved):
        return "borrowed"
    if any(r.start_date > t for r in approved):
        return "reserved"
    if any(r.status == "pending" for r in reqs):
        return "requested"
    return "available"


def item_out(db: Session, item: Item, viewer_id: int) -> ItemOut:
    owner = db.get(User, item.owner_id)
    mine = item.owner_id == viewer_id
    return ItemOut(
        id=item.id, owner=user_out(owner), title=item.title, description=item.description,
        item_type=item.item_type, brand=item.brand, size=item.size, color=item.color, style=item.style,
        care=item.care, photo_url=signed_url(item.photo_key),
        available_from=item.available_from, available_until=item.available_until,
        status_label=status_label(db, item),
        visible_to_friends=item.visible_to_friends if mine else None,
        group_ids=list(db.scalars(select(ItemShare.group_id).where(ItemShare.item_id == item.id))) if mine else None,
    )


def display_status(r: BorrowRequest, t: date | None = None) -> str:
    t = t or today()
    return "overdue" if r.status == "approved" and r.end_date < t else r.status


def borrow_out(db: Session, r: BorrowRequest, viewer_id: int) -> BorrowOut:
    return BorrowOut(
        id=r.id, item=item_out(db, db.get(Item, r.item_id), viewer_id),
        borrower=user_out(db.get(User, r.borrower_id)), owner=user_out(db.get(User, r.owner_id)),
        start_date=r.start_date, end_date=r.end_date, status=r.status, display_status=display_status(r),
        note=r.note, created_at=r.created_at,
    )
