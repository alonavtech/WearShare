"""Who is calling? Auth0 access tokens in production, a dev header locally."""
import re
import secrets
from functools import lru_cache

import httpx
import jwt
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .config import get_settings
from .db import get_db
from .models import User

settings = get_settings()


@lru_cache
def _jwks_client() -> jwt.PyJWKClient:
    return jwt.PyJWKClient(f"https://{settings.auth0_domain}/.well-known/jwks.json")


def verify_auth0_token(token: str) -> dict:
    """Check the token's signature (against Auth0's public keys), audience, issuer and expiry."""
    try:
        key = _jwks_client().get_signing_key_from_jwt(token).key
        return jwt.decode(
            token, key, algorithms=["RS256"],
            audience=settings.auth0_audience,
            issuer=f"https://{settings.auth0_domain}/",
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Your session is invalid or expired. Sign in again.") from exc


def _fetch_profile(token: str) -> dict:
    """Auth0 access tokens carry no name. Ask Auth0's /userinfo once, when the account is first created."""
    try:
        r = httpx.get(f"https://{settings.auth0_domain}/userinfo",
                      headers={"Authorization": f"Bearer {token}"}, timeout=5.0)
        if r.status_code == 200:
            return r.json()
    except (httpx.HTTPError, ValueError):
        pass
    return {}


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
    try:
        db.commit()
    except IntegrityError:  # two first requests raced; the other one created the account
        db.rollback()
        user = db.scalar(select(User).where(User.auth0_sub == sub))
        if not user:
            raise HTTPException(503, "Could not finish creating your account. Please try again.")
        return user
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
    token = authorization.split(" ", 1)[1]
    claims = verify_auth0_token(token)
    sub = claims["sub"]

    existing = db.scalar(select(User).where(User.auth0_sub == sub))
    if existing:  # normal case: no extra network call
        return existing

    profile = _fetch_profile(token)
    nickname = profile.get("nickname") or claims.get("nickname") or sub.split("|")[-1][:12]
    name = profile.get("name") or claims.get("name") or nickname
    if "@" in name:  # email/password accounts use the email as "name"; never show emails publicly
        name = nickname
    return _get_or_create(db, sub, nickname, name)
