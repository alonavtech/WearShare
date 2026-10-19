"""Checks for features added after the MVP: DM safety, profile photos, notifications, impact, prod guard."""
from datetime import timedelta
from types import SimpleNamespace

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
    good.image_storage = "vercel_blob"
    good.blob_store_id = "store_test"
    good.validate_production()


def test_production_requires_connected_blob_store():
    settings = Settings(
        app_env="production",
        auth0_domain="example.us.auth0.com",
        auth0_audience="https://api.example",
        secret_key="x" * 40,
        database_url="postgresql://db.example/wearshare",
        image_storage="vercel_blob",
    )
    with pytest.raises(RuntimeError, match="BLOB_STORE_ID"):
        settings.validate_production()


def test_frontend_and_pwa_assets_are_served(client):
    assert "manifest.webmanifest" in client.get("/").text
    assert client.get("/manifest.webmanifest").status_code == 200
    assert client.get("/sw.js").status_code == 200
    assert client.get("/icons/wearshare-192.png").headers["content-type"] == "image/png"


def test_vercel_entrypoint_exports_fastapi_app():
    from main import app as vercel_app

    assert vercel_app.title == "WearShare API"


def test_vercel_blob_photo_upload_and_signed_read(client, monkeypatch):
    from vercel import blob

    from app import storage
    from tests.test_flow import PNG

    monkeypatch.setattr(storage.settings, "image_storage", "vercel_blob")

    async def put_blob(pathname, body, **options):
        assert options == {"access": "private", "content_type": "image/png"}
        return SimpleNamespace(pathname=pathname)

    async def get_blob(pathname, **options):
        assert options == {"access": "private"}
        return SimpleNamespace(body=PNG, metadata=SimpleNamespace(content_type="image/png"))

    monkeypatch.setattr(blob, "put_blob", put_blob)
    monkeypatch.setattr(blob, "get_blob", get_blob)

    alex = as_user(client, "alex")
    uploaded = alex.post("/api/uploads", files={"file": ("dress.png", PNG, "image/png")})
    assert uploaded.status_code == 201
    assert alex.get(uploaded.json()["photo_url"]).content == PNG
