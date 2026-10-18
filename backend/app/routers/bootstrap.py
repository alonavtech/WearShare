"""One call that returns everything the signed-in user's screens need."""
from datetime import timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, or_, select, text
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..db import get_db, is_sqlite
from ..models import (BorrowRequest, Conversation, Friendship, Group, GroupMember, Item, ItemShare,
                      Message, User)
from ..permissions import friend_ids, is_member, visible_items
from ..serializers import display_status, item_out
from ..storage import avatar_link
from ..timeutil import today

router = APIRouter(prefix="/api", tags=["bootstrap"])


@router.get("/bootstrap")
def bootstrap(me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user_ids: set[int] = {me.id}

    # Friendships that involve me (accepted and pending).
    fr = db.scalars(select(Friendship).where(or_(Friendship.requester_id == me.id, Friendship.addressee_id == me.id))).all()
    friendships = [{"id": f.id, "a": f.requester_id, "b": f.addressee_id, "status": f.status} for f in fr]
    for f in fr:
        user_ids |= {f.requester_id, f.addressee_id}

    # My groups (approved and pending).
    groups = []
    for m in db.scalars(select(GroupMember).where(GroupMember.user_id == me.id)):
        g = db.get(Group, m.group_id)
        approved = m.status == "approved"
        rows = db.scalars(select(GroupMember).where(GroupMember.group_id == g.id)).all()
        members = [{"uid": r.user_id, "status": r.status} for r in rows
                   if approved and (r.status == "approved" or g.owner_id == me.id)] if approved else [{"uid": me.id, "status": m.status}]
        item_ids = []
        if approved:
            shared = db.execute(select(Item.id, Item.owner_id).join(ItemShare, ItemShare.item_id == Item.id).where(
                ItemShare.group_id == g.id, Item.status == "active")).all()
            item_ids = [iid for iid, owner in shared if is_member(db, g.id, owner)]
        groups.append({"id": g.id, "name": g.name, "owner": g.owner_id,
                       "token": g.invite_token if approved else None, "members": members, "item_ids": item_ids})
        user_ids |= {g.owner_id, *[x["uid"] for x in members]}

    # Items I can see, including my own.
    items = []
    group_of = {}
    for g in groups:
        for iid in g["item_ids"]:
            group_of.setdefault(iid, []).append(g["id"])
    visible = visible_items(db, me.id, include_own=True)
    for it in visible:
        out = item_out(db, it, me.id).model_dump(mode="json")
        if out["group_ids"] is None:
            out["group_ids"] = group_of.get(it.id, [])
            out["visible_to_friends"] = None
        out["owner_id"] = it.owner_id
        items.append(out)
        user_ids.add(it.owner_id)
    visible_ids = [i.id for i in visible]

    # Requests I sent or received, plus approved bookings on items I can see (borrower hidden).
    mine = db.scalars(select(BorrowRequest).where(or_(BorrowRequest.borrower_id == me.id, BorrowRequest.owner_id == me.id))).all()
    seen = {r.id for r in mine}
    others = db.scalars(select(BorrowRequest).where(BorrowRequest.item_id.in_(visible_ids), BorrowRequest.status == "approved")).all() if visible_ids else []

    def req(r, hide=False):
        return {"id": r.id, "item": r.item_id, "borrower": None if hide else r.borrower_id, "owner": r.owner_id,
                "start": r.start_date.isoformat(), "end": r.end_date.isoformat(), "status": r.status,
                "display_status": display_status(r), "note": r.note, "created": r.created_at.isoformat() if r.created_at else None}
    requests = [req(r) for r in mine] + [req(r, hide=True) for r in others if r.id not in seen]
    for r in mine:
        user_ids |= {r.borrower_id, r.owner_id}

    # Conversations with their messages.
    convs = []
    for c in db.scalars(select(Conversation).where(or_(Conversation.user_a_id == me.id, Conversation.user_b_id == me.id))):
        msgs = db.scalars(select(Message).where(Message.conversation_id == c.id).order_by(Message.id)).all()
        convs.append({"id": c.id, "members": [c.user_a_id, c.user_b_id],
                      "msgs": [{"from": m.sender_id, "text": m.body, "t": m.created_at.isoformat() if m.created_at else None} for m in msgs]})
        user_ids |= {c.user_a_id, c.user_b_id}

    # People mentioned anywhere above, with simple profile stats.
    users = []
    for u in db.scalars(select(User).where(User.id.in_(user_ids))):
        users.append({
            "id": u.id, "username": u.username, "display_name": u.display_name, "avatar_url": avatar_link(u.avatar_url),
            "item_count": db.scalar(select(func.count(Item.id)).where(Item.owner_id == u.id, Item.status == "active")) or 0,
            "friend_count": len(friend_ids(db, u.id)),
            "group_count": db.scalar(select(func.count(GroupMember.id)).where(GroupMember.user_id == u.id, GroupMember.status == "approved")) or 0,
        })

    return {"me": {"id": me.id, "username": me.username, "display_name": me.display_name},
            "users": users, "friendships": friendships, "groups": groups, "items": items,
            "requests": requests, "conversations": convs}


@router.get("/activity")
def activity(me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """In-app notifications computed from live request data, so they can never go stale."""
    t = today()
    soon = t + timedelta(days=2)
    rows = db.scalars(select(BorrowRequest).where(
        or_(BorrowRequest.owner_id == me.id, BorrowRequest.borrower_id == me.id),
        BorrowRequest.status.in_(["pending", "approved"])).order_by(BorrowRequest.start_date)).all()
    out = []
    for r in rows:
        item = db.get(Item, r.item_id)
        other = db.get(User, r.borrower_id if r.owner_id == me.id else r.owner_id)
        base = {"request_id": r.id, "item_id": r.item_id, "item_title": item.title, "with": other.username,
                "start": r.start_date.isoformat(), "end": r.end_date.isoformat()}
        if r.status == "pending" and r.owner_id == me.id:
            out.append({"kind": "request_received", **base})
        elif r.status == "approved" and r.end_date < t:
            out.append({"kind": "overdue", "role": "borrower" if r.borrower_id == me.id else "owner", **base})
        elif r.status == "approved" and r.borrower_id == me.id and t <= r.end_date <= soon:
            out.append({"kind": "return_due", **base})
    return {"count": len(out), "items": out}


@router.get("/impact")
def impact(me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Platform-wide activity counts (README: Impact Measurement). Counts only, no personal data."""
    def count(stmt):
        return db.scalar(stmt) or 0

    totals = {
        "members": count(select(func.count(User.id))),
        "groups": count(select(func.count(Group.id))),
        "items_listed": count(select(func.count(Item.id)).where(Item.status == "active")),
        "requests_submitted": count(select(func.count(BorrowRequest.id))),
        "requests_approved": count(select(func.count(BorrowRequest.id)).where(BorrowRequest.status.in_(["approved", "returned"]))),
        "exchanges_completed": count(select(func.count(BorrowRequest.id)).where(BorrowRequest.status == "returned")),
    }
    daily = []
    if not is_sqlite:
        try:  # time_bucket() is a Tiger Data / TimescaleDB function
            rows = db.execute(text("""
                SELECT time_bucket('1 day', created_at) AS day, kind, count(*) AS n
                FROM activity_events WHERE created_at > now() - interval '14 days'
                GROUP BY day, kind ORDER BY day""")).all()
            daily = [{"day": d.date().isoformat(), "kind": k, "count": n} for d, k, n in rows]
        except Exception:
            db.rollback()
    return {"totals": totals, "daily": daily, "source": "local" if is_sqlite else "tiger-data"}
