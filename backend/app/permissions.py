"""Access rules. The backend is the source of truth for who can see what."""
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from .models import Friendship, GroupMember, Item, ItemShare


def are_friends(db: Session, a: int, b: int) -> bool:
    return bool(db.scalar(select(Friendship.id).where(
        Friendship.status == "accepted",
        or_((Friendship.requester_id == a) & (Friendship.addressee_id == b),
            (Friendship.requester_id == b) & (Friendship.addressee_id == a)))))


def friend_ids(db: Session, uid: int) -> set[int]:
    rows = db.execute(select(Friendship.requester_id, Friendship.addressee_id).where(
        Friendship.status == "accepted",
        or_(Friendship.requester_id == uid, Friendship.addressee_id == uid))).all()
    return {b if a == uid else a for a, b in rows}


def approved_group_ids(db: Session, uid: int) -> set[int]:
    return set(db.scalars(select(GroupMember.group_id).where(
        GroupMember.user_id == uid, GroupMember.status == "approved")))


def is_member(db: Session, group_id: int, uid: int) -> bool:
    return bool(db.scalar(select(GroupMember.id).where(
        GroupMember.group_id == group_id, GroupMember.user_id == uid, GroupMember.status == "approved")))


def can_see_item(db: Session, uid: int, item: Item) -> bool:
    if item.status != "active":
        return False
    if item.owner_id == uid:
        return True
    if item.visible_to_friends and are_friends(db, uid, item.owner_id):
        return True
    my_groups = approved_group_ids(db, uid)
    if not my_groups:
        return False
    shared = set(db.scalars(select(ItemShare.group_id).where(ItemShare.item_id == item.id)))
    # Sharing only counts in groups where BOTH people are approved members.
    return any(is_member(db, g, item.owner_id) for g in shared & my_groups)


def visible_items(db: Session, uid: int, include_own: bool = False) -> list[Item]:
    friends = friend_ids(db, uid)
    groups = approved_group_ids(db, uid)
    shared_ids = select(ItemShare.item_id).where(ItemShare.group_id.in_(groups)) if groups else None
    conds = []
    if friends:
        conds.append(Item.visible_to_friends & Item.owner_id.in_(friends))
    if shared_ids is not None:
        conds.append(Item.id.in_(shared_ids))
    if include_own:
        conds.append(Item.owner_id == uid)
    if not conds:
        return []
    candidates = db.scalars(select(Item).where(Item.status == "active", or_(*conds))).all()
    return [i for i in candidates if (include_own or i.owner_id != uid) and can_see_item(db, uid, i)]
