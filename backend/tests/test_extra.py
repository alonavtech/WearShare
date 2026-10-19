"""Checks for features added after the MVP: DM safety, profile photos, notifications, impact, prod guard."""
from datetime import timedelta

import pytest

from app.config import Settings
from app.timeutil import earliest_start
from tests.conftest import as_user
from tests.test_flow import PNG, befriend, make_item


def test_strangers_cannot_dm_but_friends_can(client):
    alex, maya, eve = (as_user(client, n) for n in ("alex", "maya", "eve"))
    for u in (alex, maya, eve):
        u.get("/api/users/me")
    assert eve.post("/api/conversations/with/alex").status_code == 403
    befriend(alex, maya, "maya")
    r = alex.post("/api/conversations/with/maya")
    assert r.status_code == 200, r.text
    cid = r.json()["id"]
    assert alex.post(f"/api/conversations/{cid}/messages", json={"body": "hi"}).status_code == 201


def test_avatar_upload_is_private_signed_link(client):
    alex = as_user(client, "alex")
    alex.get("/api/users/me")
    r = alex.post("/api/users/me/avatar", files={"file": ("a.png", PNG, "image/png")})
    assert r.status_code == 200, r.text
    url = r.json()["avatar_url"]
    assert url.startswith("/api/images/")
    assert client.get(url).status_code == 200
    bad = alex.post("/api/users/me/avatar", files={"file": ("a.txt", b"not an image", "text/plain")})
    assert bad.status_code == 415
    assert alex.get("/api/bootstrap").json()["users"][0]["avatar_url"].startswith("/api/images/")
    # Users can no longer point their avatar at an arbitrary URL through the profile endpoint.
    alex.patch("/api/users/me", json={"avatar_url": "http://evil.example/x.png"})
    assert alex.get("/api/users/me").json()["avatar_url"].startswith("/api/images/")


def test_activity_shows_received_requests(client):
    alex, maya = as_user(client, "alex"), as_user(client, "maya")
    maya.get("/api/users/me")
    item = make_item(alex)
    befriend(alex, maya, "maya")
    s = earliest_start()
    r = maya.post("/api/borrow-requests", json={"item_id": item["id"], "start_date": str(s), "end_date": str(s + timedelta(days=1))})
    assert r.status_code == 201, r.text
    mine = alex.get("/api/activity").json()
    assert mine["count"] == 1 and mine["items"][0]["kind"] == "request_received"
    assert maya.get("/api/activity").json()["count"] == 0


def test_impact_totals(client):
    alex = as_user(client, "alex")
    make_item(alex)
    d = alex.get("/api/impact").json()
    assert d["totals"]["items_listed"] == 1
    assert d["daily"] == []


def test_production_refuses_unsafe_settings():
    bad = Settings(app_env="production", auth0_domain="", auth0_audience="", secret_key="short", database_url="")
    with pytest.raises(RuntimeError):
        bad.validate_production()
    good = Settings(app_env="production", auth0_domain="x.us.auth0.com", auth0_audience="https://api.example",
                    secret_key="x" * 40, database_url="postgresql://u:p@h:1/db")
    good.validate_production()
