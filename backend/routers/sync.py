from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import ValidationError

from core.db import db, NO_ID, ENTITY_COLLECTIONS
from core.models import SyncPush, BankAccountIn, CreditCardIn, CategoryIn, TransactionIn, BudgetTargetIn
from core.security import get_current_user, now_iso

router = APIRouter(prefix="/sync", tags=["sync"])

VALIDATORS = {
    "bank_accounts": BankAccountIn,
    "credit_cards": CreditCardIn,
    "categories": CategoryIn,
    "transactions": TransactionIn,
    "budget_targets": BudgetTargetIn,
}


@router.get("/pull")
async def pull(since: Optional[str] = Query(default=None), user=Depends(get_current_user)):
    """Return every record (including tombstones) changed after `since` (ISO timestamp). Omit `since` for a full snapshot."""
    server_time = now_iso()
    q: dict = {"user_id": user["id"]}
    if since:
        q["updated_at"] = {"$gt": since}
    out = {"server_time": server_time, "full": since is None}
    for name in ENTITY_COLLECTIONS:
        out[name] = await db[name].find(q, NO_ID).to_list(length=None)
    return out


@router.post("/push")
async def push(body: SyncPush, user=Depends(get_current_user)):
    """Apply a batch of client changes. Conflict rule: last-write-wins by `updated_at`."""
    applied, rejected = {}, []
    for name in ENTITY_COLLECTIONS:
        applied[name] = []
        for raw in getattr(body, name):
            item_id = raw.get("id")
            if not item_id:
                rejected.append({"collection": name, "id": None, "reason": "missing id"})
                continue
            incoming_ts = raw.get("updated_at") or now_iso()
            deleted = bool(raw.get("deleted", False))
            payload = {k: v for k, v in raw.items() if k not in ("user_id", "updated_at", "deleted", "_id")}
            if not deleted:
                try:
                    payload = {**payload, **VALIDATORS[name](**payload).model_dump()}
                except ValidationError as e:
                    rejected.append({"collection": name, "id": item_id, "reason": e.errors()[0].get("msg", "invalid")})
                    continue
            existing = await db[name].find_one({"user_id": user["id"], "id": item_id}, {"_id": 0, "updated_at": 1})
            if existing and existing.get("updated_at", "") > incoming_ts:
                continue  # server copy is newer; client will receive it on next pull
            doc = {**payload, "id": item_id, "user_id": user["id"], "updated_at": incoming_ts, "deleted": deleted}
            if name == "transactions" and "createdAt" not in doc:
                doc["createdAt"] = incoming_ts
            await db[name].replace_one({"user_id": user["id"], "id": item_id}, doc, upsert=True)
            applied[name].append(item_id)
    return {"server_time": now_iso(), "applied": applied, "rejected": rejected}
