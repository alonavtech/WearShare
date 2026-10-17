"""Private image storage. Local disk for development; swap for S3/Vultr Object Storage later.

Images are never public: the API hands out short-lived signed URLs, and only users who
are allowed to see the item get one.
"""
import hashlib
import hmac
import time
import uuid
from pathlib import Path

from .config import get_settings

settings = get_settings()
ROOT = Path(settings.upload_dir)
ALLOWED = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}


def sniff_image_type(data: bytes) -> str | None:
    """Check the file's real bytes, not just the filename or declared type."""
    if data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


def save_image(owner_id: int, data: bytes, mime: str) -> str:
    key = f"{owner_id}/{uuid.uuid4().hex}.{ALLOWED[mime]}"
    path = ROOT / key
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return key


def image_path(key: str) -> Path | None:
    path = (ROOT / key).resolve()
    if ROOT.resolve() not in path.parents or not path.is_file():
        return None
    return path


def _sig(key: str, exp: int) -> str:
    return hmac.new(settings.secret_key.encode(), f"{key}:{exp}".encode(), hashlib.sha256).hexdigest()[:32]


def signed_url(key: str | None, ttl: int = 3600) -> str | None:
    if not key:
        return None
    exp = int(time.time()) + ttl
    return f"/api/images/{key}?exp={exp}&sig={_sig(key, exp)}"


def check_signature(key: str, exp: int, sig: str) -> bool:
    return exp >= time.time() and hmac.compare_digest(_sig(key, exp), sig)
