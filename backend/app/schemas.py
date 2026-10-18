from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

from .storage import avatar_link

ITEM_TYPES = ["Dress", "Top", "Sweater", "Jacket", "Pants", "Skirt", "Shoes", "Bag"]
STYLES = ["Casual", "Going out", "Formal", "Business", "Cozy", "Sporty", "Streetwear", "Vintage", "Boho", "Edgy"]
COLORS = ["Black", "White", "Cream", "Beige", "Brown", "Red", "Pink", "Orange", "Yellow", "Green",
          "Olive", "Blue", "Navy", "Denim", "Purple", "Gray"]
Care = Literal["wash", "owner", "dry"]


class UserOut(BaseModel):
    id: int
    username: str
    display_name: str
    avatar_url: str | None = None
    school: str | None = None
    model_config = {"from_attributes": True}

    @field_validator("avatar_url")
    @classmethod
    def _signed_avatar(cls, v):
        return avatar_link(v)  # stored as a private image key; shown as a short-lived signed link


class UserUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=30, pattern=r"^[a-z0-9._]+$")
    display_name: str | None = Field(default=None, min_length=1, max_length=80)
    school: str | None = Field(default=None, max_length=120)


class PersonOut(UserOut):
    relationship: Literal["self", "friends", "request_sent", "request_received", "none"]


class FriendRequestIn(BaseModel):
    username: str


class DecisionIn(BaseModel):
    approve: bool


class ItemIn(BaseModel):
    title: str = Field(min_length=1, max_length=80)
    description: str = Field(default="", max_length=600)
    item_type: str
    brand: str = Field(default="", max_length=60)
    size: str = Field(min_length=1, max_length=10)
    color: str
    style: str
    care: Care = "wash"
    photo_key: str | None = None
    visible_to_friends: bool = True
    group_ids: list[int] = []
    available_from: date
    available_until: date

    @field_validator("item_type")
    @classmethod
    def _type(cls, v):
        if v not in ITEM_TYPES:
            raise ValueError(f"item_type must be one of {ITEM_TYPES}")
        return v

    @field_validator("style")
    @classmethod
    def _style(cls, v):
        if v not in STYLES:
            raise ValueError(f"style must be one of {STYLES}")
        return v

    @model_validator(mode="after")
    def _dates(self):
        if self.available_from > self.available_until:
            raise ValueError("available_from must be on or before available_until")
        return self


class ItemPatch(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=80)
    description: str | None = Field(default=None, max_length=600)
    item_type: str | None = None
    brand: str | None = Field(default=None, max_length=60)
    size: str | None = Field(default=None, max_length=10)
    color: str | None = None
    style: str | None = None
    care: Care | None = None
    photo_key: str | None = None
    visible_to_friends: bool | None = None
    group_ids: list[int] | None = None
    available_from: date | None = None
    available_until: date | None = None


class ItemOut(BaseModel):
    id: int
    owner: UserOut
    title: str
    description: str
    item_type: str
    brand: str
    size: str
    color: str
    style: str
    care: str
    photo_url: str | None
    available_from: date
    available_until: date
    status_label: str
    # Only filled in for the owner:
    visible_to_friends: bool | None = None
    group_ids: list[int] | None = None


class AvailabilityOut(BaseModel):
    item_id: int
    available_from: date
    available_until: date
    earliest_start: date
    booked: list[dict]  # [{"start": date, "end": date}]


class AISuggestion(BaseModel):
    title: str
    description: str
    item_type: str | None = None
    color: str | None = None
    style: str | None = None
    confidence_note: str | None = None


class UploadOut(BaseModel):
    photo_key: str
    photo_url: str


class GroupIn(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    requires_approval: bool = True


class JoinIn(BaseModel):
    invite: str = Field(min_length=3, max_length=200)  # a full link or just the token


class MemberOut(BaseModel):
    user: UserOut
    status: str


class GroupOut(BaseModel):
    id: int
    name: str
    owner: UserOut
    invite_token: str | None  # only shown to members
    my_status: str
    members: list[MemberOut]
    item_count: int


class SharingIn(BaseModel):
    shared: bool


class BulkSharingIn(BaseModel):
    item_ids: list[int]  # the complete set of my items to share in this group ("share all" = all ids)


class BorrowIn(BaseModel):
    item_id: int
    start_date: date
    end_date: date

    @model_validator(mode="after")
    def _order(self):
        if self.start_date > self.end_date:
            raise ValueError("start_date must be on or before end_date")
        return self


class BorrowOut(BaseModel):
    id: int
    item: ItemOut
    borrower: UserOut
    owner: UserOut
    start_date: date
    end_date: date
    status: str
    display_status: str  # adds "overdue"
    note: str
    created_at: datetime


class MessageIn(BaseModel):
    body: str = Field(min_length=1, max_length=2000)


class MessageOut(BaseModel):
    id: int
    sender_id: int | None
    body: str
    created_at: datetime
    model_config = {"from_attributes": True}


class ConversationOut(BaseModel):
    id: int
    other: UserOut
    last_message: MessageOut | None
