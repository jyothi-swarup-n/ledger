import os
import asyncio
import logging
from datetime import timedelta

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

from core.db import db, NO_ID, ENTITY_COLLECTIONS
from core.models import (
    RegisterRequest, VerifyOtpRequest, EmailOnly, LoginRequest, GoogleLoginRequest, GoogleSessionRequest,
    RefreshRequest, ResetPasswordRequest, ChangePasswordRequest, UpdateProfileRequest, DeleteAccountRequest,
)
from core.security import (
    hash_password, verify_password, generate_otp, sha256, new_id, now_utc, now_iso,
    build_auth_response, create_access_token, rotate_refresh_token, revoke_refresh_token,
    revoke_all_refresh_tokens, get_current_user, check_lockout, record_failed_attempt, clear_attempts, public_user,
)
from core.email_service import send_verification_otp, send_password_reset_otp, email_enabled
from core.starter_data import starter_category_docs

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger("auth")

OTP_TTL_MINUTES = 10
OTP_MAX_ATTEMPTS = 5
OTP_RESEND_COOLDOWN_SECONDS = 45

EMERGENT_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

DEFAULT_ALIASES = {"Work": "Work", "Personal": "Personal"}


async def _store_otp(email: str, purpose: str, extra: dict) -> str:
    code = generate_otp()
    await db.otp_codes.delete_many({"email": email, "purpose": purpose})
    await db.otp_codes.insert_one({
        "email": email, "purpose": purpose, "code_hash": sha256(code), "attempts": 0,
        "created_at": now_utc(), "expires_at": now_utc() + timedelta(minutes=OTP_TTL_MINUTES), **extra,
    })
    return code


async def _consume_otp(email: str, purpose: str, code: str) -> dict:
    doc = await db.otp_codes.find_one({"email": email, "purpose": purpose})
    if not doc:
        raise HTTPException(status_code=400, detail="No pending verification. Please request a new code.")
    if doc.get("attempts", 0) >= OTP_MAX_ATTEMPTS:
        await db.otp_codes.delete_one({"_id": doc["_id"]})
        raise HTTPException(status_code=429, detail="Too many incorrect attempts. Request a new code.")
    if doc["code_hash"] != sha256(code):
        await db.otp_codes.update_one({"_id": doc["_id"]}, {"$inc": {"attempts": 1}})
        raise HTTPException(status_code=400, detail="Invalid verification code.")
    await db.otp_codes.delete_one({"_id": doc["_id"]})
    return doc


def _otp_response(email: str, code: str, message: str) -> dict:
    resp = {"message": message, "email": email, "expires_in": OTP_TTL_MINUTES * 60, "email_delivery": email_enabled()}
    if not email_enabled():
        logger.warning("[DEV MODE] OTP for %s: %s", email, code)
        resp["dev_otp"] = code
    return resp


async def _create_user(email: str, name: str, password_hash: str | None, provider: str, picture: str | None = None,
                       phone: str | None = None, country_code: str | None = None) -> dict:
    user = {
        "id": new_id("user"), "email": email, "name": name, "password_hash": password_hash,
        "auth_providers": [provider], "email_verified": True, "picture": picture,
        "phone": phone, "country_code": country_code or "+91",
        "profile_aliases": dict(DEFAULT_ALIASES), "currency": "INR",
        "created_at": now_iso(), "last_login": now_iso(),
    }
    await db.users.insert_one(dict(user))
    await db.categories.insert_many(starter_category_docs(user["id"]))
    return user


# ---------------- Registration (email OTP) ----------------
@router.post("/register/request-otp")
async def register_request_otp(body: RegisterRequest):
    email = body.email.lower().strip()
    if await db.users.find_one({"email": email}, NO_ID):
        raise HTTPException(status_code=409, detail="An account with this email already exists. Please log in.")
    code = await _store_otp(email, "register", {
        "name": body.name.strip(), "password_hash": hash_password(body.password),
        "phone": (body.phone or "").strip() or None, "country_code": body.country_code or "+91",
    })
    try:
        await send_verification_otp(email, code)
    except Exception:
        raise HTTPException(status_code=502, detail="Could not send verification email. Please try again.")
    return _otp_response(email, code, "Verification code sent.")


@router.post("/register/resend-otp")
async def register_resend_otp(body: EmailOnly):
    email = body.email.lower().strip()
    pending = await db.otp_codes.find_one({"email": email, "purpose": "register"})
    if not pending:
        raise HTTPException(status_code=400, detail="No pending registration for this email.")
    if (now_utc() - pending["created_at"].replace(tzinfo=now_utc().tzinfo)).total_seconds() < OTP_RESEND_COOLDOWN_SECONDS:
        raise HTTPException(status_code=429, detail="Please wait before requesting another code.")
    code = await _store_otp(email, "register", {
        "name": pending["name"], "password_hash": pending["password_hash"],
        "phone": pending.get("phone"), "country_code": pending.get("country_code", "+91"),
    })
    await send_verification_otp(email, code)
    return _otp_response(email, code, "A new verification code was sent.")


@router.post("/register/verify")
async def register_verify(body: VerifyOtpRequest):
    email = body.email.lower().strip()
    pending = await _consume_otp(email, "register", body.code)
    if await db.users.find_one({"email": email}, NO_ID):
        raise HTTPException(status_code=409, detail="Account already exists. Please log in.")
    user = await _create_user(email, pending["name"], pending["password_hash"], "password",
                              phone=pending.get("phone"), country_code=pending.get("country_code", "+91"))
    return await build_auth_response(user, body.device)


# ---------------- Login ----------------
@router.post("/login")
async def login(body: LoginRequest, request: Request):
    email = body.email.lower().strip()
    forwarded = request.headers.get("X-Forwarded-For", "")
    client_ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "na")
    identifier = f"{client_ip}:{email}"
    await check_lockout(identifier)
    user = await db.users.find_one({"email": email}, NO_ID)
    if not user or not user.get("password_hash") or not verify_password(body.password, user["password_hash"]):
        await record_failed_attempt(identifier)
        if user and not user.get("password_hash"):
            raise HTTPException(status_code=401, detail="This account uses Google Sign-In. Continue with Google or set a password via reset.")
        raise HTTPException(status_code=401, detail="Incorrect email or password.")
    await clear_attempts(identifier)
    await db.users.update_one({"id": user["id"]}, {"$set": {"last_login": now_iso()}})
    return await build_auth_response(user, body.device)


@router.post("/google")
async def google_login(body: GoogleLoginRequest):
    client_ids = [c.strip() for c in os.environ.get("GOOGLE_CLIENT_IDS", "").split(",") if c.strip()]
    if not client_ids:
        raise HTTPException(status_code=503, detail="Google Sign-In is not configured on the server yet.")
    try:
        info = await asyncio.to_thread(google_id_token.verify_oauth2_token, body.id_token, google_requests.Request())
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token.")
    if info.get("aud") not in client_ids:
        raise HTTPException(status_code=401, detail="Google token audience mismatch.")
    if not info.get("email_verified"):
        raise HTTPException(status_code=401, detail="Google account email is not verified.")
    email = info["email"].lower()
    user = await db.users.find_one({"email": email}, NO_ID)
    if user:
        update = {"last_login": now_iso(), "picture": user.get("picture") or info.get("picture")}
        if "google" not in user.get("auth_providers", []):
            update["auth_providers"] = user.get("auth_providers", []) + ["google"]
        await db.users.update_one({"id": user["id"]}, {"$set": update})
        user.update(update)
    else:
        user = await _create_user(email, info.get("name") or email.split("@")[0], None, "google", info.get("picture"))
    return await build_auth_response(user, body.device)


@router.post("/google/session")
async def google_session(body: GoogleSessionRequest, request: Request):
    # Emergent-managed Google Auth: exchange the one-time session_id for the
    # authenticated Google profile, then issue our own JWT tokens for a uniform auth layer.
    session_id = body.session_id or request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing Google session id.")
    try:
        async with httpx.AsyncClient(timeout=15) as http_client:
            resp = await http_client.get(EMERGENT_SESSION_URL, headers={"X-Session-ID": session_id})
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Could not reach Google session service.")
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Google session is invalid or expired.")
    data = resp.json()
    email = (data.get("email") or "").lower().strip()
    if not email:
        raise HTTPException(status_code=401, detail="Google session did not return an email.")
    user = await db.users.find_one({"email": email}, NO_ID)
    if user:
        update = {"last_login": now_iso(), "picture": user.get("picture") or data.get("picture")}
        if "google" not in user.get("auth_providers", []):
            update["auth_providers"] = user.get("auth_providers", []) + ["google"]
        await db.users.update_one({"id": user["id"]}, {"$set": update})
        user.update(update)
    else:
        user = await _create_user(email, data.get("name") or email.split("@")[0], None, "google", data.get("picture"))
    return await build_auth_response(user, body.device)


# ---------------- Tokens ----------------
@router.post("/refresh")
async def refresh(body: RefreshRequest):
    user_id, new_refresh = await rotate_refresh_token(body.refresh_token)
    user = await db.users.find_one({"id": user_id}, NO_ID)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return {
        "access_token": create_access_token(user["id"], user["email"]),
        "refresh_token": new_refresh, "token_type": "bearer", "expires_in": 900,
    }


@router.post("/logout")
async def logout(body: RefreshRequest, user: dict = Depends(get_current_user)):
    await revoke_refresh_token(body.refresh_token)
    return {"message": "Logged out"}


@router.post("/logout-all")
async def logout_all(user: dict = Depends(get_current_user)):
    await revoke_all_refresh_tokens(user["id"])
    return {"message": "All sessions revoked"}


# ---------------- Password reset ----------------
@router.post("/forgot-password")
async def forgot_password(body: EmailOnly):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email}, NO_ID)
    generic = {"message": "If an account exists for this email, a reset code has been sent.", "email": email,
               "expires_in": OTP_TTL_MINUTES * 60, "email_delivery": email_enabled()}
    if not user:
        return generic
    code = await _store_otp(email, "reset", {})
    try:
        await send_password_reset_otp(email, code)
    except Exception:
        raise HTTPException(status_code=502, detail="Could not send reset email. Please try again.")
    if not email_enabled():
        logger.warning("[DEV MODE] Reset OTP for %s: %s", email, code)
        generic["dev_otp"] = code
    return generic


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest):
    email = body.email.lower().strip()
    await _consume_otp(email, "reset", body.code)
    user = await db.users.find_one({"email": email}, NO_ID)
    if not user:
        raise HTTPException(status_code=404, detail="Account not found.")
    await db.users.update_one({"id": user["id"]}, {"$set": {"password_hash": hash_password(body.new_password)},
                                                    "$addToSet": {"auth_providers": "password"}})
    await revoke_all_refresh_tokens(user["id"])
    return {"message": "Password updated. Please log in."}


# ---------------- Profile ----------------
@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@router.patch("/me")
async def update_me(body: UpdateProfileRequest, user: dict = Depends(get_current_user)):
    update = {k: v for k, v in body.model_dump(exclude_none=True).items()}
    if "name" in update:
        update["name"] = update["name"].strip()
    if "profile_aliases" in update:
        aliases = {k.strip(): v.strip() for k, v in update["profile_aliases"].items() if k.strip() and v.strip()}
        update["profile_aliases"] = {**DEFAULT_ALIASES, **aliases}
    if "currency" in update:
        update["currency"] = update["currency"].upper()
    if update:
        await db.users.update_one({"id": user["id"]}, {"$set": update})
    fresh = await db.users.find_one({"id": user["id"]}, NO_ID)
    return public_user(fresh)


@router.post("/change-password")
async def change_password(body: ChangePasswordRequest, user: dict = Depends(get_current_user)):
    full = await db.users.find_one({"id": user["id"]}, NO_ID)
    if full.get("password_hash"):
        if not body.current_password or not verify_password(body.current_password, full["password_hash"]):
            raise HTTPException(status_code=401, detail="Current password is incorrect.")
    await db.users.update_one({"id": user["id"]}, {"$set": {"password_hash": hash_password(body.new_password)},
                                                    "$addToSet": {"auth_providers": "password"}})
    return {"message": "Password changed."}


@router.delete("/me")
async def delete_me(body: DeleteAccountRequest, user: dict = Depends(get_current_user)):
    full = await db.users.find_one({"id": user["id"]}, NO_ID)
    if full.get("password_hash") and not (body.password and verify_password(body.password, full["password_hash"])):
        raise HTTPException(status_code=401, detail="Password confirmation required to delete account.")
    for name in ENTITY_COLLECTIONS:
        await db[name].delete_many({"user_id": user["id"]})
    await revoke_all_refresh_tokens(user["id"])
    await db.users.delete_one({"id": user["id"]})
    return {"message": "Account and all data permanently deleted."}
