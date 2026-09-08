# Test Credentials — Ledger by Arsonist

## Backend API (JWT, Bearer tokens)
Base: `{REACT_APP_BACKEND_URL}/api`

### Seeded test user (email/password)
- Email: `jyothi.test@example.com`
- Password: `secret123`
- Login: `POST /api/auth/login` `{"email":"jyothi.test@example.com","password":"secret123"}` → `access_token`, `refresh_token`

### Registering new users
Email delivery is in DEV MODE (no RESEND_API_KEY set): `POST /api/auth/register/request-otp` returns the OTP in the `dev_otp` field and logs it to the backend console. Then call `POST /api/auth/register/verify` with `{email, code}`.

### Google Sign-In
Not configured yet (`GOOGLE_CLIENT_IDS` empty) — `POST /api/auth/google` returns 503 by design.

### Auth endpoints
/api/auth/register/request-otp, /register/resend-otp, /register/verify, /login, /google, /refresh, /logout, /logout-all, /forgot-password, /reset-password, /me (GET/PATCH/DELETE), /change-password

## Web PWA (frontend, port 3000)
Still uses localStorage-only auth (legacy) — not yet wired to the backend.
