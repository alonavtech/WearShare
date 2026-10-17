from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..db import get_db
from ..models import Friendship, User
from ..permissions import friend_ids
from ..schemas import DecisionIn, FriendRequestIn, PersonOut, UserOut, UserUpdate

router = APIRouter(prefix="/api", tags=["users & friends"])


def _relationship(db: Session, me: int, other: int) -> str:
    if me == other:
        return "self"
    f = db.scalar(select(Friendship).where(or_(
        (Friendship.requester_id == me) & (Friendship.addressee_id == other),
        (Friendship.requester_id == other) & (Friendship.addressee_id == me))))
    if not f:
        return "none"
    if f.status == "accepted":
        return "friends"
    return "request_sent" if f.requester_id == me else "request_received"


def _person(db: Session, me: User, u: User) -> PersonOut:
    return PersonOut(**UserOut.model_validate(u).model_dump(), relationship=_relationship(db, me.id, u.id))


@router.get("/users/me", response_model=UserOut)
def get_me(me: User = Depends(get_current_user)):
    return me


@router.patch("/users/me", response_model=UserOut)
def update_me(body: UserUpdate, me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    data = body.model_dump(exclude_unset=True)
    if "username" in data and data["username"] != me.username:
        if db.scalar(select(User.id).where(User.username == data["username"])):
            raise HTTPException(409, "That username is taken.")
    for k, v in data.items():
        setattr(me, k, v)
    db.commit()
    return me


@router.get("/users/search", response_model=list[PersonOut])
def search_users(q: str = "", me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = q.strip().lstrip("@").lower()
    stmt = select(User).where(User.id != me.id)
    if q:
        stmt = stmt.where(or_(User.username.ilike(f"%{q}%"), User.display_name.ilike(f"%{q}%")))
    return [_person(db, me, u) for u in db.scalars(stmt.order_by(User.display_name).limit(25))]


@router.get("/users/{username}", response_model=PersonOut)
def get_user(username: str, me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    u = db.scalar(select(User).where(User.username == username))
    if not u:
        raise HTTPException(404, "User not found.")
    return _person(db, me, u)


@router.get("/friends", response_model=list[UserOut])
def list_friends(me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ids = friend_ids(db, me.id)
    return db.scalars(select(User).where(User.id.in_(ids)).order_by(User.display_name)).all() if ids else []


@router.get("/friends/requests")
def list_friend_requests(me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(Friendship).where(Friendship.status == "pending",
                      or_(Friendship.addressee_id == me.id, Friendship.requester_id == me.id))).all()
    out = {"received": [], "sent": []}
    for f in rows:
        incoming = f.addressee_id == me.id
        other = db.get(User, f.requester_id if incoming else f.addressee_id)
        out["received" if incoming else "sent"].append({"id": f.id, "user": UserOut.model_validate(other)})
    return out


@router.post("/friends/requests", status_code=201)
def send_friend_request(body: FriendRequestIn, me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    other = db.scalar(select(User).where(User.username == body.username.lstrip("@")))
    if not other or other.id == me.id:
        raise HTTPException(404, "User not found.")
    rel = _relationship(db, me.id, other.id)
    if rel == "friends":
        raise HTTPException(409, "You're already friends.")
    if rel == "request_sent":
        raise HTTPException(409, "Friend request already sent.")
    if rel == "request_received":  # they already asked you: accept it
        f = db.scalar(select(Friendship).where(Friendship.requester_id == other.id, Friendship.addressee_id == me.id))
        f.status = "accepted"
        db.commit()
        return {"id": f.id, "status": "accepted"}
    f = Friendship(requester_id=me.id, addressee_id=other.id)
    db.add(f)
    db.commit()
    return {"id": f.id, "status": "pending"}


@router.patch("/friends/requests/{request_id}")
def answer_friend_request(request_id: int, body: DecisionIn, me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    f = db.get(Friendship, request_id)
    if not f or f.addressee_id != me.id or f.status != "pending":
        raise HTTPException(404, "Friend request not found.")
    if body.approve:
        f.status = "accepted"
    else:
        db.delete(f)
    db.commit()
    return {"status": "accepted" if body.approve else "declined"}


@router.delete("/friends/{username}", status_code=204)
def remove_friend(username: str, me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    other = db.scalar(select(User).where(User.username == username))
    if other:
        for f in db.scalars(select(Friendship).where(or_(
                (Friendship.requester_id == me.id) & (Friendship.addressee_id == other.id),
                (Friendship.requester_id == other.id) & (Friendship.addressee_id == me.id)))):
            db.delete(f)
        db.commit()
