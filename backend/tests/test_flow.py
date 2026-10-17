"""End-to-end checks of the hackathon MVP journey and the reservation rules."""
from datetime import timedelta

from app.timeutil import earliest_start
from tests.conftest import as_user

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64


def make_item(api, **over):
    s = earliest_start()
    body = dict(title="Black slip dress", item_type="Dress", size="S", color="Black", style="Going out",
                available_from=str(s - timedelta(days=5)), available_until=str(s + timedelta(days=40)))
    body.update(over)
    r = api.post("/api/items", json=body)
    assert r.status_code == 201, r.text
    return r.json()


def befriend(a, b, b_name):
    rid = a.post("/api/friends/requests", json={"username": b_name}).json()["id"]
    assert b.patch(f"/api/friends/requests/{rid}", json={"approve": True}).status_code == 200


def test_mvp_journey_and_conflicts(client):
    alex, maya, jordan, eve = (as_user(client, n) for n in ("alex", "maya", "jordan", "eve"))
    for u in (alex, maya, jordan, eve):
        u.get("/api/users/me")

    # Upload a photo, then create a listing with it.
    up = alex.post("/api/uploads", files={"file": ("d.png", PNG, "image/png")})
    assert up.status_code == 201
    item = make_item(alex, photo_key=up.json()["photo_key"])
    assert item["photo_url"].startswith("/api/images/")
    assert client.get(item["photo_url"]).status_code == 200          # signed URL works
    assert client.get(item["photo_url"].split("?")[0] + "?exp=1&sig=x").status_code == 403

    # Private by default to strangers.
    assert eve.get(f"/api/items/{item['id']}").status_code == 404
    befriend(alex, maya, "maya")
    befriend(alex, jordan, "jordan")
    assert maya.get(f"/api/items/{item['id']}").status_code == 200
    assert any(i["id"] == item["id"] for i in maya.get("/api/items/search?q=slip").json())

    # 24-hour rule.
    s = earliest_start()
    too_soon = s - timedelta(days=1)
    r = maya.post("/api/borrow-requests", json={"item_id": item["id"], "start_date": str(too_soon), "end_date": str(s)})
    assert r.status_code == 400

    # Two overlapping pending requests are allowed.
    r1 = maya.post("/api/borrow-requests", json={"item_id": item["id"], "start_date": str(s + timedelta(days=2)), "end_date": str(s + timedelta(days=3))})
    r2 = jordan.post("/api/borrow-requests", json={"item_id": item["id"], "start_date": str(s + timedelta(days=3)), "end_date": str(s + timedelta(days=4))})
    assert r1.status_code == 201 and r2.status_code == 201

    # Only the owner can decide.
    assert maya.patch(f"/api/borrow-requests/{r1.json()['id']}/decision", json={"approve": True}).status_code == 404

    # Approve Maya -> Jordan's overlapping request is declined automatically.
    ok = alex.patch(f"/api/borrow-requests/{r1.json()['id']}/decision", json={"approve": True})
    assert ok.status_code == 200 and ok.json()["status"] == "approved"
    jr = {r["id"]: r for r in jordan.get("/api/borrow-requests").json()["sent"]}
    assert jr[r2.json()["id"]]["status"] == "declined"

    # Booked dates are blocked for new requests and show in availability.
    r3 = jordan.post("/api/borrow-requests", json={"item_id": item["id"], "start_date": str(s + timedelta(days=3)), "end_date": str(s + timedelta(days=3))})
    assert r3.status_code == 409
    av = jordan.get(f"/api/items/{item['id']}/availability").json()
    assert av["booked"] == [{"start": str(s + timedelta(days=2)), "end": str(s + timedelta(days=3))}]

    # Cancel releases the dates.
    assert maya.post(f"/api/borrow-requests/{r1.json()['id']}/cancel").status_code == 200
    r4 = jordan.post("/api/borrow-requests", json={"item_id": item["id"], "start_date": str(s + timedelta(days=3)), "end_date": str(s + timedelta(days=3))})
    assert r4.status_code == 201

    # System messages land in the DM thread.
    convs = maya.get("/api/conversations").json()
    msgs = maya.get(f"/api/conversations/{convs[0]['id']}/messages").json()
    assert any("approved" in m["body"] for m in msgs)


def test_groups_sharing(client):
    alex, priya, sam = (as_user(client, n) for n in ("alex", "priya", "sam"))
    a1 = make_item(alex, title="Red dress", color="Red")
    a2 = make_item(alex, title="Blue jeans", item_type="Pants", color="Blue", style="Casual", visible_to_friends=False)

    g = alex.post("/api/groups", json={"name": "Hume 3rd Floor"}).json()
    token = g["invite_token"]
    joined = priya.post("/api/groups/join", json={"invite": f"https://wearshare.app/join/{token}"}).json()
    assert joined["my_status"] == "pending" and joined["invite_token"] is None
    assert priya.get(f"/api/groups/{g['id']}/items").status_code == 403

    pid = priya.get("/api/users/me").json()["id"]
    assert sam.patch(f"/api/groups/{g['id']}/members/{pid}", json={"approve": True}).status_code == 403
    assert alex.patch(f"/api/groups/{g['id']}/members/{pid}", json={"approve": True}).status_code == 200

    # "Share all" from the prompt.
    assert alex.put(f"/api/groups/{g['id']}/sharing", json={"item_ids": [a1["id"], a2["id"]]}).status_code == 200
    ids = {i["id"] for i in priya.get(f"/api/groups/{g['id']}/items").json()}
    assert ids == {a1["id"], a2["id"]}
    assert priya.get(f"/api/items/{a2['id']}").status_code == 200   # visible via group even though not friends
    assert sam.get(f"/api/items/{a2['id']}").status_code == 404      # not in group

    # Can't share someone else's item.
    assert priya.put(f"/api/groups/{g['id']}/sharing", json={"item_ids": [a1["id"]]}).status_code == 403

    # Edit/delete need ownership.
    assert priya.patch(f"/api/items/{a1['id']}", json={"title": "mine now"}).status_code == 403
    assert alex.patch(f"/api/items/{a1['id']}", json={"title": "Red mini dress"}).json()["title"] == "Red mini dress"


def test_ai_without_key_returns_503(client):
    alex = as_user(client, "alex")
    r = alex.post("/api/ai/describe", files={"file": ("d.png", PNG, "image/png")})
    assert r.status_code == 503
    bad = alex.post("/api/ai/describe", files={"file": ("x.txt", b"hello", "text/plain")})
    assert bad.status_code == 415


def test_bootstrap_shape(client):
    alex, maya = as_user(client, "alex"), as_user(client, "maya")
    item = make_item(alex)
    maya.get("/api/users/me")
    befriend(alex, maya, "maya")
    b = maya.get("/api/bootstrap").json()
    assert b["me"]["username"] == "maya"
    assert any(i["id"] == item["id"] for i in b["items"])
    assert any(u["username"] == "alex" and u["item_count"] == 1 for u in b["users"])
    assert b["friendships"][0]["status"] == "accepted"
