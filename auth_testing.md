# Auth Testing — Records by Arsonist

This app uses JWT (Bearer) auth for ALL flows. Email/OTP and Login use `/api/auth/*`.
Emergent-managed Google Auth (`/api/auth/google/session`) exchanges the one-time
`session_id` for the Google profile and then issues the SAME JWT access/refresh tokens,
so there is no session_token cookie system — everything is Bearer JWT in localStorage
(`rba_access_token`, `rba_refresh_token`).

## Email / OTP / Login (fully automatable — dev OTP returned in response)
```
API={REACT_APP_BACKEND_URL}/api
# 1. request OTP
curl -s -X POST "$API/auth/register/request-otp" -H "Content-Type: application/json" \
  -d '{"name":"Alex Mercer","email":"E","password":"Sup3r!Secret12","phone":"9876543210","country_code":"+91"}'
# -> response contains dev_otp in DEV MODE (RESEND_API_KEY unset)
# 2. verify
curl -s -X POST "$API/auth/register/verify" -H "Content-Type: application/json" \
  -d '{"email":"E","code":"DEV_OTP"}'   # -> {user, access_token, refresh_token}
# 3. login
curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"E","password":"Sup3r!Secret12"}'
# 4. authed call
curl -s "$API/auth/me" -H "Authorization: Bearer <access_token>"
```

## Frontend flow (Playwright)
- Welcome (`welcome-screen`): buttons `welcome-create-account-btn`, `welcome-login-btn`, `welcome-google-btn`.
- Create Account (`signup-screen`): inputs `signup-name-input`, `signup-phone-input`,
  `signup-email-input`, `signup-password-input`; submit `signup-submit-btn`.
- OTP (`otp-screen`): boxes `otp-digit-0..5`; dev code shown in `otp-dev-hint`; `otp-verify-btn`, `otp-resend-btn`.
- Login (`login-screen`): `login-email-input`, `login-password-input`, `login-submit-btn`, `login-forgot-btn`.
- Reset (`reset-screen`): `reset-otp-digit-0..5`, `reset-new-password`, `reset-confirm-password`, `reset-submit-btn`.
- After success the app renders the dashboard (`app-main`). Tokens live in localStorage.

## Google Auth (manual only)
Cannot be automated headless (requires real Google login on auth.emergentagent.com).
Verify by clicking "Continue with Google" → completing Google → landing back on the
dashboard. Backend `/api/auth/google/session` with a bogus session_id must return 401.
