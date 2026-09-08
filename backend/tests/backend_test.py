"""Backend regression tests for Ledger by Arsonist FastAPI backend.

Covers: auth (register OTP, login, refresh rotation, logout, forgot/reset, /me,
change-password), ledger CRUD (accounts, cards, categories, subcategories,
transactions, budgets), soft-delete + tombstones, per-user scoping, sync
pull/push (last-write-wins), export json/csv, data reset, delete-me, google 503,
health.

Tests intentionally use fresh unique emails so that IP+email lockout counters
never interfere with the seeded test user."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("BACKEND_URL_OVERRIDE") or "https://063094db-01fa-40c3-b295-3bce7899da87.preview.emergentagent.com"
API = f"{BASE_URL.rstrip('/')}/api"

SEED_EMAIL = "jyothi.test@example.com"
SEED_PASSWORD = "secret123"


def _uemail(tag: str) -> str:
    return f"TEST_{tag}_{uuid.uuid4().hex[:8]}@example.com"


# ---------------- fixtures ----------------
@pytest.fixture(scope="session")
def s():
    return requests.Session()


def _register(s, email, password="secret123", name="Test User"):
    r = s.post(f"{API}/auth/register/request-otp", json={"name": name, "email": email, "password": password})
    assert r.status_code == 200, r.text
    otp = r.json()["dev_otp"]
    v = s.post(f"{API}/auth/register/verify", json={"email": email, "code": otp})
    assert v.status_code == 200, v.text
    return v.json()


@pytest.fixture(scope="session")
def seed_auth(s):
    """Login as the seeded test user."""
    r = s.post(f"{API}/auth/login", json={"email": SEED_EMAIL, "password": SEED_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Seed user login failed: {r.status_code} {r.text}")
    data = r.json()
    return {"access": data["access_token"], "refresh": data["refresh_token"], "user": data["user"]}


@pytest.fixture(scope="session")
def seed_headers(seed_auth):
    return {"Authorization": f"Bearer {seed_auth['access']}"}


# ---------------- Health / misc ----------------
class TestHealth:
    def test_health(self, s):
        r = s.get(f"{API}/health")
        assert r.status_code == 200
        j = r.json()
        assert j["status"] == "ok"
        assert "email_delivery" in j and "google_signin" in j

    def test_google_not_configured(self, s):
        r = s.post(f"{API}/auth/google", json={"id_token": "x"})
        assert r.status_code == 503
        assert "not configured" in r.json()["detail"].lower()


# ---------------- Registration ----------------
class TestRegistration:
    def test_full_register_flow_and_starter_categories(self, s):
        email = _uemail("reg")
        r = s.post(f"{API}/auth/register/request-otp",
                   json={"name": "Fresh User", "email": email, "password": "secret123"})
        assert r.status_code == 200, r.text
        body = r.json()
        assert "dev_otp" in body and body["email"].lower() == email.lower()
        otp = body["dev_otp"]

        v = s.post(f"{API}/auth/register/verify", json={"email": email, "code": otp})
        assert v.status_code == 200, v.text
        vd = v.json()
        assert "access_token" in vd and "refresh_token" in vd
        assert vd["user"]["email"].lower() == email.lower()
        assert "password_hash" not in vd["user"]

        hdr = {"Authorization": f"Bearer {vd['access_token']}"}
        cats = s.get(f"{API}/categories", headers=hdr)
        assert cats.status_code == 200
        cat_list = cats.json()
        assert len(cat_list) == 11, f"expected 11 starter categories, got {len(cat_list)}"

    def test_duplicate_email_conflict(self, s):
        email = _uemail("dup")
        _register(s, email)
        r = s.post(f"{API}/auth/register/request-otp",
                   json={"name": "Dup", "email": email, "password": "secret123"})
        assert r.status_code == 409

    def test_short_password_422(self, s):
        r = s.post(f"{API}/auth/register/request-otp",
                   json={"name": "X", "email": _uemail("short"), "password": "abc"})
        assert r.status_code == 422

    def test_wrong_otp_400_and_5_fails_429(self, s):
        email = _uemail("otp")
        r = s.post(f"{API}/auth/register/request-otp",
                   json={"name": "Otp", "email": email, "password": "secret123"})
        assert r.status_code == 200
        # 5 wrong attempts increment counter -> each returns 400
        for i in range(5):
            w = s.post(f"{API}/auth/register/verify", json={"email": email, "code": "000000"})
            assert w.status_code == 400, f"attempt {i} got {w.status_code}"
        # 6th call sees attempts >= 5 -> 429
        final = s.post(f"{API}/auth/register/verify", json={"email": email, "code": "000000"})
        assert final.status_code == 429


# ---------------- Login ----------------
class TestLogin:
    def test_login_success(self, seed_auth):
        assert seed_auth["access"] and seed_auth["refresh"]

    def test_login_wrong_password(self, s):
        # use a fresh registered user to avoid touching seed lockout counters
        email = _uemail("wpwd")
        _register(s, email)
        r = s.post(f"{API}/auth/login", json={"email": email, "password": "WRONGWRONG"})
        assert r.status_code == 401

    def test_5_fails_then_lockout(self, s):
        # NOTE: backend keys lockout on request.client.host+email. In this env
        # the ingress load-balances across multiple pod IPs, so counters split.
        # We fire up to 15 attempts to guarantee at least one IP reaches 5 and
        # then verify a subsequent attempt receives 429. This still validates
        # the mechanism works; the multi-IP bypass is reported separately.
        email = _uemail("lock")
        _register(s, email)
        got_429 = False
        for i in range(15):
            r = s.post(f"{API}/auth/login", json={"email": email, "password": "NOPE"})
            if r.status_code == 429:
                got_429 = True
                break
            assert r.status_code == 401, f"attempt {i}: {r.status_code} {r.text}"
        assert got_429, "Never received 429 lockout after 15 wrong attempts"


# ---------------- Refresh / logout ----------------
class TestTokens:
    def test_refresh_rotation_and_reuse_denied(self, s):
        email = _uemail("rot")
        reg = _register(s, email)
        old_refresh = reg["refresh_token"]
        r = s.post(f"{API}/auth/refresh", json={"refresh_token": old_refresh})
        assert r.status_code == 200
        new_pair = r.json()
        assert new_pair["access_token"] and new_pair["refresh_token"]
        assert new_pair["refresh_token"] != old_refresh
        # reuse old -> 401
        reuse = s.post(f"{API}/auth/refresh", json={"refresh_token": old_refresh})
        assert reuse.status_code == 401

    def test_logout_revokes(self, s):
        email = _uemail("lo")
        reg = _register(s, email)
        hdr = {"Authorization": f"Bearer {reg['access_token']}"}
        r = s.post(f"{API}/auth/logout", json={"refresh_token": reg["refresh_token"]}, headers=hdr)
        assert r.status_code == 200
        # refresh with revoked token fails
        rr = s.post(f"{API}/auth/refresh", json={"refresh_token": reg["refresh_token"]})
        assert rr.status_code == 401


# ---------------- /auth/me ----------------
class TestMe:
    def test_me_requires_auth(self, s):
        r = s.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_returns_no_password_hash(self, s, seed_headers):
        r = s.get(f"{API}/auth/me", headers=seed_headers)
        assert r.status_code == 200
        assert "password_hash" not in r.json()
        assert r.json()["email"] == SEED_EMAIL

    def test_patch_me_merges_aliases(self, s):
        email = _uemail("me")
        reg = _register(s, email)
        hdr = {"Authorization": f"Bearer {reg['access_token']}"}
        r = s.patch(f"{API}/auth/me", headers=hdr, json={
            "name": "New Name", "profile_aliases": {"Work": "Arsonist Holdings"}})
        assert r.status_code == 200
        u = r.json()
        assert u["name"] == "New Name"
        assert u["profile_aliases"]["Work"] == "Arsonist Holdings"
        # Personal default is merged in
        assert u["profile_aliases"].get("Personal") == "Personal"

    def test_change_password_requires_current(self, s):
        email = _uemail("cp")
        reg = _register(s, email, password="secret123")
        hdr = {"Authorization": f"Bearer {reg['access_token']}"}
        # wrong current
        r = s.post(f"{API}/auth/change-password", headers=hdr,
                   json={"current_password": "wrong", "new_password": "newpass1"})
        assert r.status_code == 401
        # right current
        r2 = s.post(f"{API}/auth/change-password", headers=hdr,
                    json={"current_password": "secret123", "new_password": "newpass1"})
        assert r2.status_code == 200
        # old password no longer works
        bad = s.post(f"{API}/auth/login", json={"email": email, "password": "secret123"})
        assert bad.status_code == 401
        good = s.post(f"{API}/auth/login", json={"email": email, "password": "newpass1"})
        assert good.status_code == 200


# ---------------- Forgot / reset ----------------
class TestReset:
    def test_forgot_unknown_email_200_no_dev_otp(self, s):
        r = s.post(f"{API}/auth/forgot-password", json={"email": _uemail("nobody")})
        assert r.status_code == 200
        assert "dev_otp" not in r.json()

    def test_forgot_then_reset_flow(self, s):
        email = _uemail("rst")
        reg = _register(s, email, password="original1")
        old_refresh = reg["refresh_token"]

        r = s.post(f"{API}/auth/forgot-password", json={"email": email})
        assert r.status_code == 200
        otp = r.json().get("dev_otp")
        assert otp

        rp = s.post(f"{API}/auth/reset-password",
                    json={"email": email, "code": otp, "new_password": "newpass2"})
        assert rp.status_code == 200

        # old password fails
        old = s.post(f"{API}/auth/login", json={"email": email, "password": "original1"})
        assert old.status_code == 401
        # new password works
        good = s.post(f"{API}/auth/login", json={"email": email, "password": "newpass2"})
        assert good.status_code == 200

        # old refresh token revoked
        rr = s.post(f"{API}/auth/refresh", json={"refresh_token": old_refresh})
        assert rr.status_code == 401


# ---------------- Ledger CRUD & per-user scoping ----------------
@pytest.fixture(scope="class")
def ledger_user(request):
    ss = requests.Session()
    email = _uemail("led")
    reg = _register(ss, email)
    hdr = {"Authorization": f"Bearer {reg['access_token']}"}
    return {"s": ss, "hdr": hdr, "email": email, "access": reg["access_token"]}


class TestLedgerCRUD:
    def test_client_supplied_id_and_conflict(self, ledger_user):
        s, hdr = ledger_user["s"], ledger_user["hdr"]
        payload = {"id": f"bank_custom_{uuid.uuid4().hex[:6]}", "name": "Custom Bank",
                   "initialOpeningBalance": 100}
        r = s.post(f"{API}/accounts", headers=hdr, json=payload)
        assert r.status_code == 201, r.text
        assert r.json()["id"] == payload["id"]
        # duplicate id -> 409
        r2 = s.post(f"{API}/accounts", headers=hdr, json=payload)
        assert r2.status_code == 409

    def test_account_crud_soft_delete(self, ledger_user):
        s, hdr = ledger_user["s"], ledger_user["hdr"]
        r = s.post(f"{API}/accounts", headers=hdr, json={"name": "HDFC", "initialOpeningBalance": 1000})
        assert r.status_code == 201
        aid = r.json()["id"]
        # patch
        p = s.patch(f"{API}/accounts/{aid}", headers=hdr, json={"name": "HDFC Salary", "initialOpeningBalance": 2000})
        assert p.status_code == 200 and p.json()["name"] == "HDFC Salary"
        # list contains it
        lst = s.get(f"{API}/accounts", headers=hdr).json()
        assert any(a["id"] == aid for a in lst)
        # delete
        d = s.delete(f"{API}/accounts/{aid}", headers=hdr)
        assert d.status_code == 200
        # not in list
        lst2 = s.get(f"{API}/accounts", headers=hdr).json()
        assert all(a["id"] != aid for a in lst2)
        # patch after delete -> 404
        p2 = s.patch(f"{API}/accounts/{aid}", headers=hdr, json={"name": "X", "initialOpeningBalance": 0})
        assert p2.status_code == 404

    def test_card_crud(self, ledger_user):
        s, hdr = ledger_user["s"], ledger_user["hdr"]
        r = s.post(f"{API}/cards", headers=hdr, json={"name": "Amex", "creditLimit": 50000, "initialOpeningBalance": 0})
        assert r.status_code == 201
        cid = r.json()["id"]
        d = s.delete(f"{API}/cards/{cid}", headers=hdr)
        assert d.status_code == 200

    def test_category_and_subcategory(self, ledger_user):
        s, hdr = ledger_user["s"], ledger_user["hdr"]
        r = s.post(f"{API}/categories", headers=hdr,
                   json={"name": "Custom", "type": "Both", "subcategories": []})
        assert r.status_code == 201
        cat_id = r.json()["id"]
        # add sub
        sub = s.post(f"{API}/categories/{cat_id}/subcategories", headers=hdr,
                     json={"name": "Sub1", "individualBudget": 100})
        assert sub.status_code == 201
        subs = sub.json()["subcategories"]
        assert any(x["name"] == "Sub1" for x in subs)
        sid = next(x["id"] for x in subs if x["name"] == "Sub1")
        # patch sub
        p = s.patch(f"{API}/categories/{cat_id}/subcategories/{sid}", headers=hdr,
                    json={"name": "Sub1 renamed", "individualBudget": 200})
        assert p.status_code == 200
        assert any(x["id"] == sid and x["name"] == "Sub1 renamed" for x in p.json()["subcategories"])
        # delete sub
        d = s.delete(f"{API}/categories/{cat_id}/subcategories/{sid}", headers=hdr)
        assert d.status_code == 200
        # patch deleted sub -> 404
        p2 = s.patch(f"{API}/categories/{cat_id}/subcategories/{sid}", headers=hdr,
                     json={"name": "x", "individualBudget": 0})
        assert p2.status_code == 404

    def test_transactions_and_filters(self, ledger_user):
        s, hdr = ledger_user["s"], ledger_user["hdr"]
        acc = s.post(f"{API}/accounts", headers=hdr, json={"name": "TxBank", "initialOpeningBalance": 0}).json()
        cats = s.get(f"{API}/categories", headers=hdr).json()
        cat = next(c for c in cats if c["name"] == "Income")
        tx_work = {"date": "2026-01-05", "description": "Salary", "type": "Work",
                   "categoryId": cat["id"], "accountOrCardId": acc["id"],
                   "direction": "Credit", "amount": 5000}
        tx_personal = {**tx_work, "description": "Bonus", "type": "Personal", "date": "2025-12-20"}
        r1 = s.post(f"{API}/transactions", headers=hdr, json=tx_work)
        r2 = s.post(f"{API}/transactions", headers=hdr, json=tx_personal)
        assert r1.status_code == 201 and r2.status_code == 201

        # filter month
        m = s.get(f"{API}/transactions?month=2026-01", headers=hdr).json()
        assert all(t["date"].startswith("2026-01") for t in m)
        assert any(t["id"] == r1.json()["id"] for t in m)
        # filter type
        wonly = s.get(f"{API}/transactions?type=Work", headers=hdr).json()
        assert all(t["type"] == "Work" for t in wonly)
        # months distinct
        months = s.get(f"{API}/transactions/months", headers=hdr).json()
        assert "2026-01" in months and "2025-12" in months

    def test_budgets_put_upserts(self, ledger_user):
        s, hdr = ledger_user["s"], ledger_user["hdr"]
        payload = {"monthKey": "2026-01", "categoryId": "cat_housing",
                   "subcategoryId": "sub_rent", "amount": 1000}
        r1 = s.put(f"{API}/budgets", headers=hdr, json=payload)
        assert r1.status_code in (200, 201)
        first = r1.json()
        # upsert same key with new amount -> same id
        r2 = s.put(f"{API}/budgets", headers=hdr, json={**payload, "amount": 2000})
        assert r2.status_code == 200
        assert r2.json()["id"] == first["id"]
        assert r2.json()["amount"] == 2000
        # only one exists
        lst = s.get(f"{API}/budgets?month=2026-01", headers=hdr).json()
        matches = [b for b in lst if b["categoryId"] == "cat_housing" and b.get("subcategoryId") == "sub_rent"]
        assert len(matches) == 1

    def test_per_user_scope(self, ledger_user, s):
        # ledger_user's account should not be visible to a fresh user
        u2_email = _uemail("u2")
        u2 = _register(s, u2_email)
        h2 = {"Authorization": f"Bearer {u2['access_token']}"}
        # create resource in user 1
        s1 = ledger_user["s"]; h1 = ledger_user["hdr"]
        r = s1.post(f"{API}/accounts", headers=h1, json={"name": "Private", "initialOpeningBalance": 5})
        assert r.status_code == 201
        aid = r.json()["id"]
        # user 2 cannot patch or delete that id
        p = s.patch(f"{API}/accounts/{aid}", headers=h2, json={"name": "hack", "initialOpeningBalance": 0})
        assert p.status_code == 404
        d = s.delete(f"{API}/accounts/{aid}", headers=h2)
        assert d.status_code == 404


# ---------------- Sync ----------------
class TestSync:
    def test_pull_push_tombstone_and_lww(self, s):
        email = _uemail("sync")
        reg = _register(s, email)
        hdr = {"Authorization": f"Bearer {reg['access_token']}"}

        # full pull
        full = s.get(f"{API}/sync/pull", headers=hdr).json()
        assert full["full"] is True and "server_time" in full
        assert len(full["categories"]) == 11
        server_time = full["server_time"]

        time.sleep(1.1)  # ensure updated_at > server_time
        # push a new bank account
        acc_id = f"bank_sync_{uuid.uuid4().hex[:6]}"
        push_ts = "2030-01-01T00:00:00+00:00"
        push_payload = {"bank_accounts": [{
            "id": acc_id, "name": "SyncBank", "initialOpeningBalance": 1,
            "updated_at": push_ts,
        }]}
        r = s.post(f"{API}/sync/push", headers=hdr, json=push_payload)
        assert r.status_code == 200
        rj = r.json()
        assert acc_id in rj["applied"]["bank_accounts"]

        # incremental pull returns the new item
        inc = s.get(f"{API}/sync/pull", headers=hdr, params={"since": server_time}).json()
        assert any(a["id"] == acc_id for a in inc["bank_accounts"])
        new_server_time = inc["server_time"]

        # last-write-wins: pushing older ts must be ignored
        older = {"bank_accounts": [{"id": acc_id, "name": "STALE",
                                     "initialOpeningBalance": 999,
                                     "updated_at": "2020-01-01T00:00:00+00:00"}]}
        r2 = s.post(f"{API}/sync/push", headers=hdr, json=older).json()
        assert acc_id not in r2["applied"]["bank_accounts"]
        # verify server copy unchanged
        got = s.get(f"{API}/accounts", headers=hdr).json()
        found = next((a for a in got if a["id"] == acc_id), None)
        assert found and found["name"] == "SyncBank"

        # delete → tombstone via REST delete, then incremental pull sees deleted:true
        time.sleep(1.1)
        d = s.delete(f"{API}/accounts/{acc_id}", headers=hdr)
        assert d.status_code == 200
        inc2 = s.get(f"{API}/sync/pull", headers=hdr, params={"since": new_server_time}).json()
        tomb = next((a for a in inc2["bank_accounts"] if a["id"] == acc_id), None)
        assert tomb and tomb["deleted"] is True

        # invalid item -> rejected
        bad = s.post(f"{API}/sync/push", headers=hdr, json={
            "transactions": [{"id": "tx_bad", "date": "not-a-date", "description": "X",
                              "type": "Work", "categoryId": "c", "accountOrCardId": "a",
                              "direction": "Debit", "amount": 10, "updated_at": push_ts}]
        }).json()
        assert any(x["id"] == "tx_bad" for x in bad["rejected"])


# ---------------- Export ----------------
class TestExport:
    def test_export_json(self, s, seed_headers):
        r = s.get(f"{API}/export/json", headers=seed_headers)
        assert r.status_code == 200
        j = r.json()
        for k in ("bank_accounts", "credit_cards", "categories", "transactions", "budget_targets"):
            assert k in j
        assert "user" in j and j["user"]["email"] == SEED_EMAIL

    def test_export_csv(self, s):
        email = _uemail("csv")
        reg = _register(s, email)
        hdr = {"Authorization": f"Bearer {reg['access_token']}"}
        # add one tx
        acc = s.post(f"{API}/accounts", headers=hdr, json={"name": "CsvBank", "initialOpeningBalance": 0}).json()
        s.post(f"{API}/transactions", headers=hdr, json={
            "date": "2026-01-10", "description": "Test entry", "type": "Personal",
            "categoryId": "cat_dining", "accountOrCardId": acc["id"],
            "direction": "Debit", "amount": 42})
        r = s.get(f"{API}/export/csv", headers=hdr)
        assert r.status_code == 200
        assert "text/csv" in r.headers.get("content-type", "")
        lines = r.text.strip().splitlines()
        assert lines[0].startswith("Date,Description")
        assert any("Test entry" in ln for ln in lines[1:])


# ---------------- Data reset / delete-me ----------------
class TestDataMgmt:
    def test_reset_data_restores_11_categories(self, s):
        email = _uemail("rst2")
        reg = _register(s, email)
        hdr = {"Authorization": f"Bearer {reg['access_token']}"}
        # add stuff
        s.post(f"{API}/accounts", headers=hdr, json={"name": "X", "initialOpeningBalance": 0})
        s.post(f"{API}/categories", headers=hdr, json={"name": "Custom", "type": "Both", "subcategories": []})
        r = s.post(f"{API}/data/reset", headers=hdr)
        assert r.status_code == 200
        assert s.get(f"{API}/accounts", headers=hdr).json() == []
        cats = s.get(f"{API}/categories", headers=hdr).json()
        assert len(cats) == 11

    def test_delete_me_then_login_fails(self, s):
        email = _uemail("del")
        reg = _register(s, email, password="delpass1")
        hdr = {"Authorization": f"Bearer {reg['access_token']}"}
        # requires password
        r0 = s.request("DELETE", f"{API}/auth/me", headers=hdr, json={})
        assert r0.status_code == 401
        r = s.request("DELETE", f"{API}/auth/me", headers=hdr, json={"password": "delpass1"})
        assert r.status_code == 200
        # login now fails
        li = s.post(f"{API}/auth/login", json={"email": email, "password": "delpass1"})
        assert li.status_code == 401
