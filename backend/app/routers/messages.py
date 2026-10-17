from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..db import get_db
from ..models import Conversation, Message, User
from ..schemas import ConversationOut, MessageIn, MessageOut, UserOut
from ..services import get_or_create_conversation

router = APIRouter(prefix="/api/conversations", tags=["messages"])


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
    c = get_or_create_conversation(db, me.id, other.id)
    db.commit()
    return _conv_out(db, c, me)


@router.get("/{cid}/messages", response_model=list[MessageOut])
def get_messages(cid: int, me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _mine(db, cid, me)
    return db.scalars(select(Message).where(Message.conversation_id == cid).order_by(Message.id)).all()


@router.post("/{cid}/messages", response_model=MessageOut, status_code=201)
def send_message(cid: int, body: MessageIn, me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _mine(db, cid, me)
    m = Message(conversation_id=cid, sender_id=me.id, body=body.body.strip())
    db.add(m)
    db.commit()
    db.refresh(m)
    return m
