import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..db import get_db
from ..models import Group, GroupMember, Item, ItemShare, User
from ..permissions import is_member
from ..schemas import BulkSharingIn, DecisionIn, GroupIn, GroupOut, ItemOut, JoinIn, MemberOut, SharingIn, UserOut
from ..serializers import item_out

router = APIRouter(prefix="/api/groups", tags=["groups"])


def _group_out(db: Session, g: Group, me: User) -> GroupOut:
    rows = db.scalars(select(GroupMember).where(GroupMember.group_id == g.id)).all()
    mine = next((m for m in rows if m.user_id == me.id), None)
    member = bool(mine and mine.status == "approved")
    visible = [m for m in rows if m.status == "approved" or g.owner_id == me.id]  # only owners see pending people
    count = db.scalar(select(func.count(ItemShare.id)).join(Item, Item.id == ItemShare.item_id).where(
        ItemShare.group_id == g.id, Item.status == "active")) or 0
    return GroupOut(
        id=g.id, name=g.name, owner=UserOut.model_validate(db.get(User, g.owner_id)),
        invite_token=g.invite_token if member else None, my_status=mine.status if mine else "none",
        members=[MemberOut(user=UserOut.model_validate(db.get(User, m.user_id)), status=m.status) for m in visible] if member else [],
        item_count=count,
    )


def _get_group(db: Session, gid: int) -> Group:
    g = db.get(Group, gid)
    if not g:
        raise HTTPException(404, "Group not found.")
    return g


@router.get("", response_model=list[GroupOut])
def my_groups(me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ids = db.scalars(select(GroupMember.group_id).where(GroupMember.user_id == me.id))
    return [_group_out(db, db.get(Group, gid), me) for gid in ids]


@router.post("", response_model=GroupOut, status_code=201)
def create_group(body: GroupIn, me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    g = Group(name=body.name.strip(), owner_id=me.id, invite_token=secrets.token_urlsafe(9), requires_approval=body.requires_approval)
    db.add(g)
    db.flush()
    db.add(GroupMember(group_id=g.id, user_id=me.id, status="approved"))
    db.commit()
    return _group_out(db, g, me)


@router.post("/join", response_model=GroupOut)
def join_group(body: JoinIn, me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    token = body.invite.strip().rstrip("/").split("/")[-1]
    g = db.scalar(select(Group).where(Group.invite_token == token))
    if not g:
        raise HTTPException(404, "That invite link isn't valid.")
    m = db.scalar(select(GroupMember).where(GroupMember.group_id == g.id, GroupMember.user_id == me.id))
    if not m:
        db.add(GroupMember(group_id=g.id, user_id=me.id, status="pending" if g.requires_approval else "approved"))
        db.commit()
    return _group_out(db, g, me)


@router.get("/{gid}", response_model=GroupOut)
def get_group(gid: int, me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    g = _get_group(db, gid)
    if not db.scalar(select(GroupMember.id).where(GroupMember.group_id == gid, GroupMember.user_id == me.id)):
        raise HTTPException(404, "Group not found.")
    return _group_out(db, g, me)


@router.patch("/{gid}/members/{user_id}")
def decide_member(gid: int, user_id: int, body: DecisionIn, me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    g = _get_group(db, gid)
    if g.owner_id != me.id:
        raise HTTPException(403, "Only the group owner can approve members.")
    m = db.scalar(select(GroupMember).where(GroupMember.group_id == gid, GroupMember.user_id == user_id, GroupMember.status == "pending"))
    if not m:
        raise HTTPException(404, "No pending request from that person.")
    if body.approve:
        m.status = "approved"
    else:
        db.delete(m)
    db.commit()
    return {"status": "approved" if body.approve else "declined"}


@router.delete("/{gid}/members/me", status_code=204)
def leave_group(gid: int, me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    g = _get_group(db, gid)
    if g.owner_id == me.id:
        raise HTTPException(400, "Owners can't leave their own group.")
    m = db.scalar(select(GroupMember).where(GroupMember.group_id == gid, GroupMember.user_id == me.id))
    if m:
        db.delete(m)
    # Stop sharing my items with a group I left.
    my_item_ids = select(Item.id).where(Item.owner_id == me.id)
    for s in db.scalars(select(ItemShare).where(ItemShare.group_id == gid, ItemShare.item_id.in_(my_item_ids))):
        db.delete(s)
    db.commit()


@router.get("/{gid}/items", response_model=list[ItemOut])
def group_items(gid: int, me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_group(db, gid)
    if not is_member(db, gid, me.id):
        raise HTTPException(403, "Join this group to see its closet.")
    items = db.scalars(select(Item).join(ItemShare, ItemShare.item_id == Item.id).where(
        ItemShare.group_id == gid, Item.status == "active")).all()
    return [item_out(db, i, me.id) for i in items if is_member(db, gid, i.owner_id)]


@router.put("/{gid}/items/{item_id}/sharing")
def set_item_sharing(gid: int, item_id: int, body: SharingIn, me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not is_member(db, gid, me.id):
        raise HTTPException(403, "You're not a member of this group.")
    item = db.get(Item, item_id)
    if not item or item.owner_id != me.id or item.status != "active":
        raise HTTPException(404, "Item not found.")
    share = db.scalar(select(ItemShare).where(ItemShare.item_id == item_id, ItemShare.group_id == gid))
    if body.shared and not share:
        db.add(ItemShare(item_id=item_id, group_id=gid))
    if not body.shared and share:
        db.delete(share)
    db.commit()
    return {"shared": body.shared}


@router.put("/{gid}/sharing")
def set_bulk_sharing(gid: int, body: BulkSharingIn, me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """The share-items prompt: send every item id you want shared here (Share All = all of them)."""
    if not is_member(db, gid, me.id):
        raise HTTPException(403, "You're not a member of this group.")
    mine = set(db.scalars(select(Item.id).where(Item.owner_id == me.id, Item.status == "active")))
    wanted = set(body.item_ids)
    if not wanted <= mine:
        raise HTTPException(403, "You can only share your own items.")
    for s in db.scalars(select(ItemShare).where(ItemShare.group_id == gid, ItemShare.item_id.in_(mine))):
        if s.item_id not in wanted:
            db.delete(s)
    have = set(db.scalars(select(ItemShare.item_id).where(ItemShare.group_id == gid, ItemShare.item_id.in_(mine))))
    for iid in wanted - have:
        db.add(ItemShare(item_id=iid, group_id=gid))
    db.commit()
    return {"shared_count": len(wanted)}
