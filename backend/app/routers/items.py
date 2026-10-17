from datetime import date

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..config import get_settings
from ..db import get_db
from ..models import BorrowRequest, Item, ItemShare, User
from ..permissions import can_see_item, is_member, visible_items
from ..schemas import AvailabilityOut, ItemIn, ItemOut, ItemPatch, UploadOut
from ..serializers import item_out
from ..storage import check_signature, image_path, save_image, signed_url, sniff_image_type
from ..timeutil import earliest_start

router = APIRouter(prefix="/api", tags=["items"])
settings = get_settings()


async def read_image(file: UploadFile) -> tuple[bytes, str]:
    data = await file.read(settings.max_upload_mb * 1024 * 1024 + 1)
    if len(data) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(413, f"Photos must be {settings.max_upload_mb} MB or smaller.")
    mime = sniff_image_type(data)
    if not mime:
        raise HTTPException(415, "Upload a JPG, PNG, or WebP photo.")
    return data, mime


def _get_visible(db: Session, item_id: int, me: User) -> Item:
    item = db.get(Item, item_id)
    if not item or not can_see_item(db, me.id, item):
        raise HTTPException(404, "Item not found.")  # 404 so private items don't leak
    return item


def _get_owned(db: Session, item_id: int, me: User) -> Item:
    item = db.get(Item, item_id)
    if not item or item.status != "active":
        raise HTTPException(404, "Item not found.")
    if item.owner_id != me.id:
        raise HTTPException(403, "Only the owner can change this listing.")
    return item


def _check_photo_key(key: str | None, me: User) -> None:
    if key and (not key.startswith(f"{me.id}/") or not image_path(key)):
        raise HTTPException(400, "That photo wasn't uploaded by you.")


def _set_groups(db: Session, item: Item, group_ids: list[int], me: User) -> None:
    for gid in group_ids:
        if not is_member(db, gid, me.id):
            raise HTTPException(403, "You can only share with groups you belong to.")
    for share in db.scalars(select(ItemShare).where(ItemShare.item_id == item.id)):
        if share.group_id not in group_ids:
            db.delete(share)
    existing = set(db.scalars(select(ItemShare.group_id).where(ItemShare.item_id == item.id)))
    for gid in set(group_ids) - existing:
        db.add(ItemShare(item_id=item.id, group_id=gid))


@router.post("/uploads", response_model=UploadOut, status_code=201)
async def upload_photo(file: UploadFile = File(...), me: User = Depends(get_current_user)):
    data, mime = await read_image(file)
    key = save_image(me.id, data, mime)
    return UploadOut(photo_key=key, photo_url=signed_url(key))


@router.get("/images/{key:path}")
def get_image(key: str, exp: int = Query(...), sig: str = Query(...)):
    # Signed URLs let <img> tags load private photos without sending auth headers.
    if not check_signature(key, exp, sig):
        raise HTTPException(403, "This image link has expired.")
    path = image_path(key)
    if not path:
        raise HTTPException(404, "Image not found.")
    return FileResponse(path, headers={"Cache-Control": "private, max-age=3600"})


@router.post("/items", response_model=ItemOut, status_code=201)
def create_item(body: ItemIn, me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _check_photo_key(body.photo_key, me)
    data = body.model_dump(exclude={"group_ids"})
    item = Item(owner_id=me.id, **data)
    db.add(item)
    db.flush()
    _set_groups(db, item, body.group_ids, me)
    db.commit()
    return item_out(db, item, me.id)


@router.get("/items/mine", response_model=list[ItemOut])
def my_items(me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.scalars(select(Item).where(Item.owner_id == me.id, Item.status == "active").order_by(Item.created_at.desc()))
    return [item_out(db, i, me.id) for i in items]


@router.get("/users/{username}/items", response_model=list[ItemOut])
def user_closet(username: str, me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    owner = db.scalar(select(User).where(User.username == username))
    if not owner:
        raise HTTPException(404, "User not found.")
    items = db.scalars(select(Item).where(Item.owner_id == owner.id, Item.status == "active").order_by(Item.created_at.desc()))
    return [item_out(db, i, me.id) for i in items if can_see_item(db, me.id, i)]


@router.get("/items/search", response_model=list[ItemOut])
def search_items(
    q: str = "", item_type: str = "", size: str = "", color: str = "", style: str = "", brand: str = "",
    available_on: date | None = None,
    me: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    q = q.strip().lower()
    out = []
    for i in visible_items(db, me.id):
        hay = " ".join([i.title, i.description, i.brand, i.item_type, i.color, i.style]).lower()
        if q and q not in hay:
            continue
        if item_type and i.item_type != item_type: continue
        if size and i.size != size: continue
        if color and i.color != color: continue
        if style and i.style != style: continue
        if brand and brand.lower() not in i.brand.lower(): continue
        if available_on and not _free_on(db, i, available_on): continue
        out.append(item_out(db, i, me.id))
    return out


def _free_on(db: Session, item: Item, d: date) -> bool:
    if not (item.available_from <= d <= item.available_until):
        return False
    return not db.scalar(select(BorrowRequest.id).where(
        BorrowRequest.item_id == item.id, BorrowRequest.status == "approved",
        BorrowRequest.start_date <= d, BorrowRequest.end_date >= d))


@router.get("/items/{item_id}", response_model=ItemOut)
def get_item(item_id: int, me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return item_out(db, _get_visible(db, item_id, me), me.id)


@router.patch("/items/{item_id}", response_model=ItemOut)
def update_item(item_id: int, body: ItemPatch, me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = _get_owned(db, item_id, me)
    data = body.model_dump(exclude_unset=True)
    if "photo_key" in data:
        _check_photo_key(data["photo_key"], me)
    groups = data.pop("group_ids", None)
    merged = {**{c: getattr(item, c) for c in ItemIn.model_fields if c != "group_ids"}, **data}
    try:
        ItemIn(**merged, group_ids=[])  # re-validate the full listing
    except ValidationError as exc:
        raise HTTPException(422, exc.errors(include_url=False, include_context=False)) from exc
    for k, v in data.items():
        setattr(item, k, v)
    if groups is not None:
        _set_groups(db, item, groups, me)
    db.commit()
    return item_out(db, item, me.id)


@router.delete("/items/{item_id}", status_code=204)
def delete_item(item_id: int, me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = _get_owned(db, item_id, me)
    item.status = "deleted"  # soft delete keeps borrowing history intact
    for r in db.scalars(select(BorrowRequest).where(BorrowRequest.item_id == item.id, BorrowRequest.status == "pending")):
        r.status, r.note = "canceled", "The owner removed this listing."
    db.commit()


@router.get("/items/{item_id}/availability", response_model=AvailabilityOut)
def availability(item_id: int, me: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = _get_visible(db, item_id, me)
    booked = db.scalars(select(BorrowRequest).where(BorrowRequest.item_id == item.id, BorrowRequest.status == "approved")).all()
    return AvailabilityOut(item_id=item.id, available_from=item.available_from, available_until=item.available_until,
                           earliest_start=earliest_start(), booked=[{"start": r.start_date, "end": r.end_date} for r in booked])
