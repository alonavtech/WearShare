"""Who is calling? Auth0 access tokens in production, a dev header locally."""
import re
import secrets
from functools import lru_cache

import jwt
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import get_settings
from .db import get_db
from .models import User

settings = get_settings()


@lru_cache
def _jwks_client() -> jwt.PyJWKClient:
    return jwt.PyJWKClient(f"https://{settings.auth0_domain}/.well-known/jwks.json")


def verify_auth0_token(token: str) -> dict:
    try:
        key = _jwks_client().get_signing_key_from_jwt(token).key
        return jwt.decode(
            token, key, algorithms=["RS256"],
            audience=settings.auth0_audience,
            issuer=f"https://{settings.auth0_domain}/",
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Your session is invalid or expired. Sign in again.") from exc


def _unique_username(db: Session, base: str) -> str:
    base = re.sub(r"[^a-z0-9._]", "", base.lower())[:24] or "user"
    name = base
    while db.scalar(select(User.id).where(User.username == name)):
        name = f"{base}{secrets.randbelow(9000) + 1000}"
    return name


def _get_or_create(db: Session, sub: str, username_hint: str, display: str) -> User:
    user = db.scalar(select(User).where(User.auth0_sub == sub))
    if user:
        return user
    user = User(auth0_sub=sub, username=_unique_username(db, username_hint), display_name=display[:80] or "New user")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_current_user(
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
    x_dev_user: str | None = Header(default=None),
) -> User:
    # Never trust user IDs sent by the client: identity only comes from a verified token
    # (or, in local dev mode only, from the X-Dev-User header).
    if settings.dev_auth:
        if not x_dev_user:
            raise HTTPException(401, "Dev mode: send an X-Dev-User header with a username.")
        handle = re.sub(r"[^a-zA-Z0-9._-]", "", x_dev_user)[:30]
        return _get_or_create(db, f"dev|{handle}", handle, handle.capitalize())

    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Sign in to continue.")
    claims = verify_auth0_token(authorization.split(" ", 1)[1])
    sub = claims["sub"]
    hint = claims.get("nickname") or claims.get("https://wearshare.app/username") or sub.split("|")[-1][:12]
    return _get_or_create(db, sub, hint, claims.get("name") or hint)
