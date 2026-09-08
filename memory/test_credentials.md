# Test Credentials — Records by Arsonist

## Backend API (JWT, Bearer tokens)
Base: `{REACT_APP_BACKEND_URL}/api`

### Seeded test user (email/password)
- Email: `jyothi.test@example.com`
- Password: `secret123`
- Login: `POST /api/auth/login` `{"email":"jyothi.test@example.com","password":"secret123"}` → `access_token`, `refresh_token`

### Registering new users
Email delivery is in DEV MODE (no RESEND_API_KEY set): `POST /api/auth/register/request-otp` returns the OTP in the `dev_otp` field and logs it to the backend console. Then call `POST /api/auth/register/verify` with `{email, code}`.

### Google Sign-In
Two mechanisms exist:
- Legacy Google ID-token endpoint `POST /api/auth/google` (needs `GOOGLE_CLIENT_IDS`) — returns 503 by design when unset.
- **Emergent-managed Google Auth** `POST /api/auth/google/session` — used by the web app. Frontend redirects to `https://auth.emergentagent.com/?redirect=<origin>/`; on return the `#session_id=` fragment is exchanged here for a real user + JWT tokens. Cannot be automated via headless browser (requires real Google login). Verify manually.

### Auth endpoints
/api/auth/register/request-otp, /register/resend-otp, /register/verify, /login, /google, /google/session, /refresh, /logout, /logout-all, /forgot-password, /reset-password, /me (GET/PATCH/DELETE), /change-password

## Web PWA (frontend, port 3000)
Auth screens (Welcome → Create Account → OTP → Login, plus Reset via Forgot Password) are wired to the **real FastAPI backend**. Tokens stored in localStorage (`rba_access_token`, `rba_refresh_token`). Finance ledger data is still browser-local (localStorage), keyed by the backend user id.

### End-to-end auth test (frontend)
1. Welcome → Create Account. Fill name, phone (India +91), email, password (12+ chars for STRONG). Continue to Verification.
2. On the OTP screen the code appears in the `DEV MODE · code:` hint (dev mode, no email sent). Enter it → Verify Code → lands on dashboard.
3. Logout, then Welcome → Log In With Email → same email/password → dashboard.
4. Forgot Password → reset code shown in DEV MODE hint → set new key.

### Dashboard design test fixture (browser-only, no backend account)
- Email: `records.ui.test@example.com`
- Display name: `Records Reviewer`
- User id: `records_ui_review`
- Password: none; this is an isolated browser-state fixture, not a real login.
- To view dashboard in automated design tests, set `kinetic_ledger_users_v2` to a JSON array containing `{ "id": "records_ui_review", "name": "Records Reviewer", "email": "records.ui.test@example.com", "createdAt": "2026-06-01T00:00:00Z" }` and `kinetic_ledger_active_user_id` to `records_ui_review` before loading the app.
- Start without `kinetic_ledger_data_records_ui_review` for an empty ledger. Test data must remain in the isolated browser context only.
- Existing Google sign-in and Google backup in the PWA are **MOCKED**, not real Google integrations. Do not treat this fixture as authentication verification.
