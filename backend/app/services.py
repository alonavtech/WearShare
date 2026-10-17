from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Conversation, Message


def get_or_create_conversation(db: Session, a: int, b: int) -> Conversation:
    lo, hi = sorted((a, b))
    conv = db.scalar(select(Conversation).where(Conversation.user_a_id == lo, Conversation.user_b_id == hi))
    if not conv:
        conv = Conversation(user_a_id=lo, user_b_id=hi)
        db.add(conv)
        db.flush()
    return conv


def system_message(db: Session, a: int, b: int, text: str) -> None:
    conv = get_or_create_conversation(db, a, b)
    db.add(Message(conversation_id=conv.id, sender_id=None, body=text))
