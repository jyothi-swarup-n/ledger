# Ledger by Arsonist — Backend API

Base URL: `{BACKEND_URL}/api` · Auth: `Authorization: Bearer <access_token>`

Access token lives 15 min; refresh token 30 days (rotated on every refresh, single-use). Mobile stores both in SecureStore and calls `/auth/refresh` on 401.

## Auth
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | /auth/register/request-otp | name, email, password | Sends 6-digit OTP (10 min). Dev mode (no RESEND_API_KEY) returns `dev_otp` |
| POST | /auth/register/resend-otp | email | 45 s cooldown |
| POST | /auth/register/verify | email, code, device? | Creates user + starter categories → `{user, access_token, refresh_token}` |
| POST | /auth/login | email, password, device? | 5 failures → 15 min lockout (per IP+email) |
| POST | /auth/google | id_token, device? | Verifies Google ID token against `GOOGLE_CLIENT_IDS`; 503 until configured |
| POST | /auth/refresh | refresh_token | Returns new access + rotated refresh token |
| POST | /auth/logout | refresh_token | Revokes that device's refresh token |
| POST | /auth/logout-all | — | Revokes every refresh token |
| POST | /auth/forgot-password | email | Always 200 (no account enumeration). Sends reset OTP |
| POST | /auth/reset-password | email, code, new_password | Revokes all sessions |
| GET | /auth/me | — | Current user |
| PATCH | /auth/me | name?, profile_aliases?, currency? | Aliases e.g. `{"Work":"Arsonist Holdings"}` |
| POST | /auth/change-password | current_password?, new_password | current not required for Google-only users |
| DELETE | /auth/me | password? | Deletes user + all ledger data |

## Ledger (all user-scoped, soft-deleted with tombstones)
Every record has `id` (client may supply its own UUID for offline creation), `user_id`, `updated_at` (ISO), `deleted`.

- `GET/POST /accounts`, `PATCH/DELETE /accounts/{id}` — BankAccount `{name, initialOpeningBalance, accountNumberMask?, color?}`
- `GET/POST /cards`, `PATCH/DELETE /cards/{id}` — CreditCard `{name, creditLimit, initialOpeningBalance, cardNumberMask?, dueDateDay?, autoPay, color?}`
- `GET/POST /categories`, `PATCH/DELETE /categories/{id}` — `{name, type: Work|Personal|Both, icon?, isTransfer, subcategories[]}`
- `POST /categories/{id}/subcategories`, `PATCH/DELETE /categories/{id}/subcategories/{subId}` — `{name, individualBudget, recurringDueDate?}`
- `GET /transactions?month=YYYY-MM&account_id=&category_id=&type=&limit=` · `GET /transactions/months` · `POST /transactions` · `GET/PATCH/DELETE /transactions/{id}`
  - `{date: YYYY-MM-DD, description, type, categoryId, subcategoryId?, accountOrCardId, direction: Credit|Debit, amount>0, notes?, receiptImage?, splitWith?}`
- `GET /budgets?month=` · `PUT /budgets` `{monthKey, categoryId, subcategoryId?, amount}` (upsert) · `DELETE /budgets/{id}`
- `POST /data/reset` — wipe ledger, restore starter categories

## Offline-first sync
- `GET /sync/pull?since=<ISO>` → `{server_time, full, bank_accounts[], credit_cards[], categories[], transactions[], budget_targets[]}` including tombstones. Omit `since` for full snapshot. Store `server_time` as next `since`.
- `POST /sync/push` `{bank_accounts:[], credit_cards:[], categories:[], transactions:[], budget_targets:[]}` — each item carries `id`, `updated_at`, optional `deleted: true`. Last-write-wins by `updated_at`. Returns `{applied, rejected}`.

Client loop: on reconnect → push local queue → pull since last server_time → merge into local SQLite.

## Export
- `GET /export/json` · `GET /export/csv`

## Environment
`MONGO_URL, DB_NAME, JWT_SECRET, CORS_ORIGINS, RESEND_API_KEY, SENDER_EMAIL, GOOGLE_CLIENT_IDS (comma-separated web/android/ios client IDs), APP_NAME`
