import csv
import io

from fastapi import APIRouter, Depends
from fastapi.responses import PlainTextResponse

from core.db import db, NO_ID, ENTITY_COLLECTIONS
from core.security import get_current_user, now_iso

router = APIRouter(prefix="/export", tags=["export"])


async def _all(user_id: str) -> dict:
    return {name: await db[name].find({"user_id": user_id, "deleted": False}, NO_ID).to_list(length=None) for name in ENTITY_COLLECTIONS}


@router.get("/json")
async def export_json(user=Depends(get_current_user)):
    data = await _all(user["id"])
    return {"version": "3.0", "exportedAt": now_iso(), "user": {"email": user["email"], "name": user.get("name")}, **data}


@router.get("/csv", response_class=PlainTextResponse)
async def export_csv(user=Depends(get_current_user)):
    data = await _all(user["id"])
    cats = {c["id"]: c for c in data["categories"]}
    accounts = {a["id"]: a["name"] for a in data["bank_accounts"]}
    accounts.update({c["id"]: c["name"] for c in data["credit_cards"]})
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["Date", "Description", "Type", "Category", "Subcategory", "Account/Card", "Direction", "Amount (INR)", "Notes"])
    for t in sorted(data["transactions"], key=lambda x: x["date"], reverse=True):
        cat = cats.get(t["categoryId"], {})
        sub = next((s["name"] for s in cat.get("subcategories", []) if s["id"] == t.get("subcategoryId")), "")
        w.writerow([t["date"], t["description"], t["type"], cat.get("name", t["categoryId"]), sub,
                    accounts.get(t["accountOrCardId"], t["accountOrCardId"]), t["direction"], t["amount"], t.get("notes") or ""])
    return PlainTextResponse(buf.getvalue(), media_type="text/csv",
                             headers={"Content-Disposition": 'attachment; filename="ledger-export.csv"'})
