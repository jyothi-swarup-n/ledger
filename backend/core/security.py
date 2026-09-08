import os
import hashlib
import secrets
import uuid
from datetime import datetime, timezone, timedelta

import bcrypt
import jwt
from fastapi import HTTPException, Request

from .db import db, NO_ID

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_MINUTES = 15
REFRESH_TOKEN_DAYS = 30
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def now_iso() -> str:
    return now_utc().isoformat()


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:16]}"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def sha256(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def generate_otp() -> str:
    return f"{secrets.randbelow(900000) + 100000}"


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "type": "access",
        "exp": now_utc() + timedelta(minutes=ACCESS_TOKEN_MINUTES),
    }
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)


async def issue_refresh_token(user_id: str, device: str | None) -> str:
    raw = secrets.token_urlsafe(48)
    await db.refresh_tokens.insert_one(
        {
            "token_hash": sha256(raw),
            "user_id": user_id,
            "device": device or "unknown",
            "created_at": now_utc(),
            "expires_at": now_utc() + timedelta(days=REFRESH_TOKEN_DAYS),
        }
    )
    return raw


async def rotate_refresh_token(raw: str) -> tuple[str, str]:
    doc = await db.refresh_tokens.find_one_and_delete({"token_hash": sha256(raw)})
    if not doc:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    expires_at = doc["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < now_utc():
        raise HTTPException(status_code=401, detail="Refresh token expired")
    new_raw = await issue_refresh_token(doc["user_id"], doc.get("device"))
    return doc["user_id"], new_raw


async def revoke_refresh_token(raw: str):
    await db.refresh_tokens.delete_one({"token_hash": sha256(raw)})


async def revoke_all_refresh_tokens(user_id: str):
    await db.refresh_tokens.delete_many({"user_id": user_id})


def public_user(user: dict) -> dict:
    user.pop("_id", None)
    user.pop("password_hash", None)
    return user


async def build_auth_response(user: dict, device: str | None) -> dict:
    refresh = await issue_refresh_token(user["id"], device)
    return {
        "user": public_user(dict(user)),
        "access_token": create_access_token(user["id"], user["email"]),
        "refresh_token": refresh,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_MINUTES * 60,
    }


async def get_current_user(request: Request) -> dict:
    token = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")
    user = await db.users.find_one({"id": payload["sub"]}, NO_ID)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    user.pop("password_hash", None)
    return user


async def check_lockout(identifier: str):
    doc = await db.login_attempts.find_one({"identifier": identifier})
    if doc and doc.get("count", 0) >= MAX_LOGIN_ATTEMPTS:
        raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")


async def record_failed_attempt(identifier: str):
    await db.login_attempts.update_one(
        {"identifier": identifier},
        {"$inc": {"count": 1}, "$set": {"expires_at": now_utc() + timedelta(minutes=LOCKOUT_MINUTES)}},
        upsert=True,
    )


async def clear_attempts(identifier: str):
    await db.login_attempts.delete_one({"identifier": identifier})
