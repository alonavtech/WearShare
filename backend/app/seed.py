"""Fill the database with the same demo data as the front-end prototype.

Run:  python -m app.seed
Dev login users: me (Alex), maya, jordan, priya, sam, ava, leo  ->  send "X-Dev-User: maya"
"""
from datetime import timedelta

from .db import Base, SessionLocal, engine
from .models import BorrowRequest, Friendship, Group, GroupMember, Item, ItemShare, Message, User
from .services import get_or_create_conversation
from .timeutil import today


def run() -> None:
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    db = SessionLocal()
    T = today()
    D = lambda n: T + timedelta(days=n)

    people = {
        "me": ("alex.n", "Alex Nguyen"), "maya": ("mayachen", "Maya Chen"), "jordan": ("jlee", "Jordan Lee"),
        "priya": ("priyap", "Priya Patel"), "sam": ("samr", "Sam Rivera"), "ava": ("avabrooks", "Ava Brooks"),
        "leo": ("leokim", "Leo Kim"),
    }
    U = {}
    for handle, (username, name) in people.items():
        U[handle] = User(auth0_sub=f"dev|{handle}", username=username, display_name=name, school="University of Florida")
        db.add(U[handle])
    db.flush()

    for a, b, st in [("me", "maya", "accepted"), ("me", "jordan", "accepted"), ("maya", "jordan", "accepted"), ("leo", "me", "pending")]:
        db.add(Friendship(requester_id=U[a].id, addressee_id=U[b].id, status=st))

    groups = {
        "hume": ("Hume Hall · 3rd Floor", "maya", "HUME-3F-7Q2", {"maya": "approved", "me": "approved", "priya": "approved", "sam": "approved"}),
        "sigma": ("Sigma Lambda Sisters", "me", "SIGMA-LAMBDA-91", {"me": "approved", "jordan": "approved", "ava": "approved", "sam": "pending"}),
        "run": ("Gator Run Club", "priya", "GATOR-RUN", {"priya": "approved", "ava": "approved"}),
    }
    G = {}
    for k, (name, owner, token, members) in groups.items():
        G[k] = Group(name=name, owner_id=U[owner].id, invite_token=token)
        db.add(G[k]); db.flush()
        for h, st in members.items():
            db.add(GroupMember(group_id=G[k].id, user_id=U[h].id, status=st))

    rows = [
        ("i1", "me", "Black satin slip dress", "Dress", "Black", "Reformation", "S", "Going out", "Black satin slip dress with thin straps and a midi length. Perfect for formals and date nights.", "dry", True, ["hume", "sigma"]),
        ("i2", "me", "Mid-wash denim jacket", "Jacket", "Denim", "Levi's", "M", "Casual", "Classic mid-wash denim jacket with a slightly oversized fit.", "owner", True, ["hume"]),
        ("i3", "me", "Cream cable-knit sweater", "Sweater", "Cream", "Aritzia", "S", "Cozy", "Soft cream cable-knit sweater, great for cold lecture halls.", "wash", True, []),
        ("i4", "me", "White leather sneakers", "Shoes", "White", "Nike", "8", "Sporty", "Clean white leather sneakers with minimal wear.", "owner", False, ["sigma"]),
        ("i5", "maya", "Red mini dress", "Dress", "Red", "Zara", "S", "Going out", "Bright red mini dress with a square neckline.", "wash", True, ["hume"]),
        ("i6", "maya", "Navy tailored blazer", "Jacket", "Navy", "Aritzia", "S", "Business", "Structured navy blazer for interviews and career fairs.", "dry", True, ["hume"]),
        ("i7", "maya", "Olive cargo pants", "Pants", "Olive", "Free People", "M", "Streetwear", "Relaxed olive cargo pants with deep pockets.", "owner", True, []),
        ("i9", "jordan", "Green satin midi skirt", "Skirt", "Green", "Zara", "S", "Going out", "Emerald satin midi skirt with a bias cut.", "wash", True, ["sigma"]),
        ("i10", "jordan", "Oversized gray hoodie", "Sweater", "Gray", "Nike", "L", "Cozy", "Heavyweight gray hoodie, very oversized.", "owner", True, []),
        ("i12", "priya", "Yellow floral sundress", "Dress", "Yellow", "Free People", "M", "Boho", "Flowy yellow sundress with a floral print.", "wash", False, ["hume"]),
        ("i14", "sam", "Purple ruched top", "Top", "Purple", "Urban Outfitters", "M", "Going out", "Fitted purple top with ruched sides.", "wash", False, ["hume"]),
        ("i15", "ava", "White formal gown", "Dress", "White", "Lulus", "S", "Formal", "Floor-length white gown for formals and banquets.", "dry", False, ["sigma"]),
    ]
    I = {}
    for key, owner, title, typ, color, brand, size, style, desc, care, friends, gs in rows:
        I[key] = Item(owner_id=U[owner].id, title=title, item_type=typ, color=color, brand=brand, size=size, style=style,
                      description=desc, care=care, visible_to_friends=friends, available_from=D(-30), available_until=D(60))
        db.add(I[key]); db.flush()
        for g in gs:
            db.add(ItemShare(item_id=I[key].id, group_id=G[g].id))

    for item, borrower, s, e, st in [("i1", "jordan", 6, 7, "pending"), ("i1", "maya", 7, 8, "pending"), ("i6", "me", 3, 3, "pending"),
                                     ("i5", "priya", 10, 11, "approved"), ("i2", "jordan", -4, -1, "approved"), ("i9", "me", -12, -10, "returned")]:
        db.add(BorrowRequest(item_id=I[item].id, borrower_id=U[borrower].id, owner_id=I[item].owner_id,
                             start_date=D(s), end_date=D(e), status=st))

    c = get_or_create_conversation(db, U["me"].id, U["maya"].id)
    for who, text in [("me", "Hey! Could I borrow your navy blazer for my career fair?"), ("maya", "Of course! Just send a request for the day 🙂")]:
        db.add(Message(conversation_id=c.id, sender_id=U[who].id, body=text))
    db.commit()
    db.close()
    print("Seeded demo data. Try: curl -H 'X-Dev-User: me' http://localhost:8000/api/items/mine")


if __name__ == "__main__":
    run()
