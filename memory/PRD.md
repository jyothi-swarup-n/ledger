# Ledger by Arsonist — PRD

## Original problem statement
Convert the existing "Kinetic Ledger" PWA (React 19 + Vite + Tailwind, localStorage-only, fake auth) into a production-ready, store-publishable **React Native** mobile app with a real full-stack backend. Keep the PWA as a web companion. Publish to Play Store + App Store.

## User decisions
- Phase order: Backend first (this session) → Mobile (Expo/React Native) next
- Auth: Email + password (JWT) with real OTP email verification (Resend) **and** Google Sign-In
- Mobile: offline-first with local cache that syncs when online
- Keep PWA in repo (moved to `/app/frontend`)
- App name: **Ledger by Arsonist**. No sample/demo data in production.

## Architecture
```
/app/backend   FastAPI + MongoDB (Motor). JWT access (15m) + rotating refresh tokens (30d).
               core/ (db, security, email_service, models, starter_data)
               routers/ (auth, ledger, sync, export)   ·  API.md = endpoint reference
/app/frontend  Legacy PWA (Vite). Still localStorage-only; to be wired to backend later.
/app/mobile    (next phase) Expo + TypeScript + expo-router + NativeWind + SQLite cache
```

## Personas
- Jyothi / Arsonist Group owner: tracks Work vs Personal finances, multiple bank accounts + credit cards, INR, monthly rollover budgets.

## Core requirements (static)
- Secure multi-user auth (OTP-verified email, Google), per-user data isolation
- Bank accounts, credit cards, categories/subcategories, transactions, monthly budget targets
- Offline-first mobile with conflict-safe sync
- Export JSON/CSV; account + data deletion (store compliance)

## Implemented — 2026-06 (Session 1: Backend)
- Auth: register (OTP request/resend/verify), login w/ brute-force lockout (real client IP via X-Forwarded-For), Google ID-token endpoint (503 until `GOOGLE_CLIENT_IDS` set), refresh rotation (single-use), logout/logout-all, forgot/reset password via OTP, /me GET/PATCH/DELETE, change-password
- Email via Resend (`core/email_service.py`) — DEV MODE when `RESEND_API_KEY` empty: OTP logged + returned as `dev_otp`
- Ledger CRUD with client-supplied ids, soft-delete tombstones, `updated_at` on every record; budgets PUT-upsert
- Sync: `GET /sync/pull?since=` (incremental incl. tombstones) and `POST /sync/push` (last-write-wins)
- Export JSON/CSV, `/data/reset`, starter categories seeded per user (11)
- PWA moved to /app/frontend, `start` script + `allowedHosts` added; still running
- Testing: 29/29 backend tests pass (`/app/backend/tests/backend_test.py`, report `/app/test_reports/iteration_1.json`)

## Implemented — 2026-06 (Session 2: Web auth wiring + onboarding)
- Renamed brand to **Records by Arsonist**; rebuilt auth as 4 launch screens matching design: Welcome → Create Account → OTP Verify → Login (+ Reset via Forgot Password). Files: `frontend/src/components/AuthScreen.tsx`.
- Web PWA auth now wired to the REAL FastAPI backend (`frontend/src/services/api.ts`): register request-otp / verify / resend, login, forgot/reset. JWT tokens in localStorage (`rba_access_token`/`rba_refresh_token`). Finance ledger data still browser-local, keyed by backend user id.
- Signup collects **phone + country code (default +91)**; backend `RegisterRequest` + `_create_user` store `phone`/`country_code`.
- **Emergent-managed Google Sign-In** implemented: welcome button redirects to auth.emergentagent.com; backend `POST /api/auth/google/session` exchanges the one-time session_id and issues our own JWT (uniform auth). App.tsx handles the `#session_id=` callback. (Manual verification only — cannot be headless-tested.)
- Backend `.env` CORS_ORIGINS updated to current preview origin; Vite `envPrefix` extended to expose `REACT_APP_*`.
- **First-run onboarding wizard** (`frontend/src/components/Onboarding.tsx`), shown after auth until completed (localStorage `rba_onboarded_<userId>`): Welcome ("activated") → Add Banks & Credit Cards hub → Add Bank Account / Add Credit Card forms → Set Up Budgets & Limits → Dashboard. Rupee (₹) throughout, fast-select presets HDFC/ICICI/AXIS/SBI/OTHER for banks + cards, no Plaid/telemetry blocks, Save Bank Account + Save Credit Card buttons. Budget step distributes each category limit across its subcategories' individualBudget (or category-level month override when no subs).
- Testing: frontend E2E 10/10 pass (`/app/test_reports/iteration_3.json`); backend register/verify/login/google-session verified via curl.

## Backlog
### P0 (next session — Mobile core)
- Scaffold `/app/mobile` Expo app (TypeScript, expo-router, NativeWind, dark neo-brutalist theme #0b0e14/#c3f400)
- Auth screens (signup → OTP → login, forgot password), SecureStore token storage, auto-refresh interceptor
- Tab navigation: Dashboard, Budgets, Log, Analytics, Accounts; port FinanceContext calculation engine
- Offline-first data layer: expo-sqlite cache + sync queue → /sync endpoints
### P1
- Google Sign-In on mobile (expo-auth-session / @react-native-google-signin) + set `GOOGLE_CLIENT_IDS`
- Set `RESEND_API_KEY` + verified sender domain for real OTP emails
- Wire PWA (/app/frontend) FINANCE DATA to backend API (auth already wired; accounts/tx/budgets still localStorage). Persist onboarding-complete flag on backend user profile so it survives cross-device / cleared storage.
- Settings: profile aliases, change password, delete account, export share sheet
### P2 — Store readiness
- App icons/splash, `app.json`/EAS build profiles, privacy policy URL, store listings
- Push notifications for credit-card due dates; receipt image upload (object storage)

## Pending from user
- Resend API key (and optionally verified sender domain e.g. noreply@arsonist.online)
- Google OAuth client IDs (Web + Android + iOS) — guide provided in chat
