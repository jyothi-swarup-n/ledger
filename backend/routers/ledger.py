from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from core.db import db, NO_ID, ENTITY_COLLECTIONS
from core.models import BankAccountIn, CreditCardIn, CategoryIn, SubcategoryIn, TransactionIn, BudgetTargetIn
from core.security import get_current_user, new_id, now_iso
from core.starter_data import starter_category_docs

router = APIRouter(tags=["ledger"])


async def _list(coll: str, user_id: str, extra: dict | None = None, sort: list | None = None) -> list[dict]:
    q = {"user_id": user_id, "deleted": False, **(extra or {})}
    cursor = db[coll].find(q, NO_ID)
    if sort:
        cursor = cursor.sort(sort)
    return await cursor.to_list(length=None)


async def _get(coll: str, user_id: str, item_id: str) -> dict:
    doc = await db[coll].find_one({"user_id": user_id, "id": item_id, "deleted": False}, NO_ID)
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    doc.pop("_id", None)
    return dict(doc)


async def _create(coll: str, user_id: str, data: dict, prefix: str) -> dict:
    doc = {**data, "id": data.get("id") or new_id(prefix), "user_id": user_id, "updated_at": now_iso(), "deleted": False}
    existing = await db[coll].find_one({"user_id": user_id, "id": doc["id"]}, NO_ID)
    if existing and not existing.get("deleted"):
        raise HTTPException(status_code=409, detail="An item with this id already exists")
    await db[coll].replace_one({"user_id": user_id, "id": doc["id"]}, doc, upsert=True)
    return doc


async def _update(coll: str, user_id: str, item_id: str, updates: dict) -> dict:
    updates = {k: v for k, v in updates.items() if k not in ("id", "user_id", "deleted", "updated_at")}
    updates["updated_at"] = now_iso()
    res = await db[coll].update_one({"user_id": user_id, "id": item_id, "deleted": False}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return await _get(coll, user_id, item_id)


async def _soft_delete(coll: str, user_id: str, item_id: str) -> dict:
    res = await db[coll].update_one({"user_id": user_id, "id": item_id, "deleted": False},
                                    {"$set": {"deleted": True, "updated_at": now_iso()}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"id": item_id, "deleted": True}


# ---------------- Bank accounts ----------------
@router.get("/accounts")
async def list_accounts(user=Depends(get_current_user)):
    return await _list("bank_accounts", user["id"])


@router.post("/accounts", status_code=201)
async def create_account(body: BankAccountIn, user=Depends(get_current_user)):
    return await _create("bank_accounts", user["id"], body.model_dump(), "bank")


@router.patch("/accounts/{item_id}")
async def update_account(item_id: str, body: BankAccountIn, user=Depends(get_current_user)):
    return await _update("bank_accounts", user["id"], item_id, body.model_dump(exclude_unset=True))


@router.delete("/accounts/{item_id}")
async def delete_account(item_id: str, user=Depends(get_current_user)):
    return await _soft_delete("bank_accounts", user["id"], item_id)


# ---------------- Credit cards ----------------
@router.get("/cards")
async def list_cards(user=Depends(get_current_user)):
    return await _list("credit_cards", user["id"])


@router.post("/cards", status_code=201)
async def create_card(body: CreditCardIn, user=Depends(get_current_user)):
    return await _create("credit_cards", user["id"], body.model_dump(), "card")


@router.patch("/cards/{item_id}")
async def update_card(item_id: str, body: CreditCardIn, user=Depends(get_current_user)):
    return await _update("credit_cards", user["id"], item_id, body.model_dump(exclude_unset=True))


@router.delete("/cards/{item_id}")
async def delete_card(item_id: str, user=Depends(get_current_user)):
    return await _soft_delete("credit_cards", user["id"], item_id)


# ---------------- Categories & subcategories ----------------
@router.get("/categories")
async def list_categories(user=Depends(get_current_user)):
    return await _list("categories", user["id"])


@router.post("/categories", status_code=201)
async def create_category(body: CategoryIn, user=Depends(get_current_user)):
    data = body.model_dump()
    data["subcategories"] = [{**s, "id": s.get("id") or new_id("sub")} for s in data["subcategories"]]
    return await _create("categories", user["id"], data, "cat")


@router.patch("/categories/{item_id}")
async def update_category(item_id: str, body: CategoryIn, user=Depends(get_current_user)):
    return await _update("categories", user["id"], item_id, body.model_dump(exclude_unset=True))


@router.delete("/categories/{item_id}")
async def delete_category(item_id: str, user=Depends(get_current_user)):
    return await _soft_delete("categories", user["id"], item_id)


@router.post("/categories/{cat_id}/subcategories", status_code=201)
async def add_subcategory(cat_id: str, body: SubcategoryIn, user=Depends(get_current_user)):
    cat = await _get("categories", user["id"], cat_id)
    sub = {**body.model_dump(), "id": body.id or new_id("sub")}
    subs = [s for s in cat.get("subcategories", []) if s["id"] != sub["id"]] + [sub]
    return await _update("categories", user["id"], cat_id, {"subcategories": subs})


@router.patch("/categories/{cat_id}/subcategories/{sub_id}")
async def update_subcategory(cat_id: str, sub_id: str, body: SubcategoryIn, user=Depends(get_current_user)):
    cat = await _get("categories", user["id"], cat_id)
    subs = cat.get("subcategories", [])
    if not any(s["id"] == sub_id for s in subs):
        raise HTTPException(status_code=404, detail="Subcategory not found")
    patch = body.model_dump(exclude_unset=True, exclude={"id"})
    subs = [{**s, **patch} if s["id"] == sub_id else s for s in subs]
    return await _update("categories", user["id"], cat_id, {"subcategories": subs})


@router.delete("/categories/{cat_id}/subcategories/{sub_id}")
async def delete_subcategory(cat_id: str, sub_id: str, user=Depends(get_current_user)):
    cat = await _get("categories", user["id"], cat_id)
    subs = [s for s in cat.get("subcategories", []) if s["id"] != sub_id]
    return await _update("categories", user["id"], cat_id, {"subcategories": subs})


# ---------------- Transactions ----------------
@router.get("/transactions")
async def list_transactions(
    month: Optional[str] = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    account_id: Optional[str] = None,
    category_id: Optional[str] = None,
    type: Optional[str] = None,
    limit: int = Query(default=500, le=2000),
    user=Depends(get_current_user),
):
    extra: dict = {}
    if month:
        extra["date"] = {"$regex": f"^{month}"}
    if account_id:
        extra["accountOrCardId"] = account_id
    if category_id:
        extra["categoryId"] = category_id
    if type in ("Work", "Personal"):
        extra["type"] = type
    docs = await _list("transactions", user["id"], extra, [("date", -1), ("createdAt", -1)])
    return docs[:limit]


@router.get("/transactions/months")
async def transaction_months(user=Depends(get_current_user)):
    dates = await db.transactions.distinct("date", {"user_id": user["id"], "deleted": False})
    return sorted({d[:7] for d in dates if d})


@router.post("/transactions", status_code=201)
async def create_transaction(body: TransactionIn, user=Depends(get_current_user)):
    data = body.model_dump()
    data["createdAt"] = now_iso()
    return await _create("transactions", user["id"], data, "tx")


@router.get("/transactions/{item_id}")
async def get_transaction(item_id: str, user=Depends(get_current_user)):
    return await _get("transactions", user["id"], item_id)


@router.patch("/transactions/{item_id}")
async def update_transaction(item_id: str, body: TransactionIn, user=Depends(get_current_user)):
    return await _update("transactions", user["id"], item_id, body.model_dump(exclude_unset=True))


@router.delete("/transactions/{item_id}")
async def delete_transaction(item_id: str, user=Depends(get_current_user)):
    return await _soft_delete("transactions", user["id"], item_id)


# ---------------- Budget targets ----------------
@router.get("/budgets")
async def list_budgets(month: Optional[str] = Query(default=None, pattern=r"^\d{4}-\d{2}$"), user=Depends(get_current_user)):
    return await _list("budget_targets", user["id"], {"monthKey": month} if month else None)


@router.put("/budgets")
async def upsert_budget(body: BudgetTargetIn, user=Depends(get_current_user)):
    q = {"user_id": user["id"], "monthKey": body.monthKey, "categoryId": body.categoryId,
         "subcategoryId": body.subcategoryId, "deleted": False}
    existing = await db.budget_targets.find_one(q, NO_ID)
    if existing:
        return await _update("budget_targets", user["id"], existing["id"], {"amount": body.amount})
    return await _create("budget_targets", user["id"], body.model_dump(), "bt")


@router.delete("/budgets/{item_id}")
async def delete_budget(item_id: str, user=Depends(get_current_user)):
    return await _soft_delete("budget_targets", user["id"], item_id)


# ---------------- Data management ----------------
@router.post("/data/reset")
async def reset_data(user=Depends(get_current_user)):
    for name in ENTITY_COLLECTIONS:
        await db[name].delete_many({"user_id": user["id"]})
    await db.categories.insert_many(starter_category_docs(user["id"]))
    return {"message": "All ledger data cleared. Starter categories restored."}
