from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..db import get_db
from ..models import BorrowRequest, Conversation, GroupMember, Message, User
from ..permissions import approved_group_ids, are_friends
from ..schemas import ConversationOut, MessageIn, MessageOut, UserOut
from ..services import get_or_create_conversation

router = APIRouter(prefix="/api/conversations", tags=["messages"])


NOT_CONNECTED = "You can message friends, people in your groups, or people you've borrowed from or lent to."


def _can_message(db: Session, me_id: int, other_id: int) -> bool:
    """Stops strangers from messaging anyone: you need a real connection first."""
    if are_friends(db, me_id, other_id):
        return True
    mine = approved_group_ids(db, me_id)
    if mine and db.scalar(select(GroupMember.id).where(
            GroupMember.user_id == other_id, GroupMember.status == "approved", GroupMember.group_id.in_(mine)).limit(1)):
        return True
    return bool(db.scalar(select(BorrowRequest.id).where(or_(
        and_(BorrowRequest.borrower_id == me_id, BorrowRequest.owner_id == other_id),
        and_(BorrowRequest.borrower_id == other_id, BorrowRequest.owner_id == me_id))).limit(1)))


def _conv_out(db: Session, c: Conversation, me: User) -> ConversationOut:
    other = db.get(User, c.user_b_id if c.user_a_id == me.id else c.user_a_id)
    last = db.scalar(select(Message).where(Message.conversation_id == c.id).order_by(Message.id.desc()).limit(1))
    return ConversationOut(id=c.id, other=UserOut.model_validate(other), last_message=MessageOut.model_validate(last) if last else None)


def _mine(db: Session, cid: int, me: User) -> Conversation:
    c = db.get(Conversation, cid)
    if not c or me.id not in (c.user_a_id, c.user_b_id):
        raise HTTPException(404, "Conversation not found.")
    return c


@router.get("", response_model=list[ConversationOut])
def list_conversations(me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    convs = db.scalars(select(Conversation).where(or_(Conversation.user_a_id == me.id, Conversation.user_b_id == me.id))).all()
    out = [_conv_out(db, c, me) for c in convs]
    return sorted(out, key=lambda c: c.last_message.created_at if c.last_message else c.id, reverse=True) if out else []


@router.post("/with/{username}", response_model=ConversationOut)
def open_conversation(username: str, me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    other = db.scalar(select(User).where(User.username == username))
    if not other or other.id == me.id:
        raise HTTPException(404, "User not found.")
    if not _can_message(db, me.id, other.id):
        raise HTTPException(403, NOT_CONNECTED)
    c = get_or_create_conversation(db, me.id, other.id)
    db.commit()
    return _conv_out(db, c, me)


@router.get("/{cid}/messages", response_model=list[MessageOut])
def get_messages(cid: int, me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _mine(db, cid, me)
    return db.scalars(select(Message).where(Message.conversation_id == cid).order_by(Message.id)).all()


@router.post("/{cid}/messages", response_model=MessageOut, status_code=201)
def send_message(cid: int, body: MessageIn, me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    c = _mine(db, cid, me)
    other_id = c.user_b_id if c.user_a_id == me.id else c.user_a_id
    if not _can_message(db, me.id, other_id):
        raise HTTPException(403, NOT_CONNECTED)
    m = Message(conversation_id=cid, sender_id=me.id, body=body.body.strip())
    db.add(m)
    db.commit()
    db.refresh(m)
    return m
