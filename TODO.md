# Production Auth Audit — Fix Progress

## Approved Plan

### Bug 1: Google OAuth opens localhost (frontend)
- [x] `google-signin-button.tsx` fallback → Railway URL
- [x] Cleared stale `.next` cache
- [x] Rebuilt web app

### Bug 2: Google OAuth strategy registration fragile (API)
- [x] `auth.module.ts`: conditional GoogleStrategy registration
- [x] `auth.controller.ts`: added `assertGoogleConfigured()`; removed localhost fallbacks for FRONTEND_CALLBACK_URL / FRONTEND_URL

### Bug 3: Hardcoded localhost fallbacks in API
- [x] `auth.controller.ts`: removed localhost defaults
- [x] `main.ts`: CORS_ORIGIN now env-driven (no localhost default in production)

### Bug 4: env validation consistency
- [x] `env.validation.ts`: CORS_ORIGIN optional (no localhost default)

### Frontend env
- [x] `.env.local`: NEXT_PUBLIC_API_URL + NEXT_PUBLIC_GOOGLE_REDIRECT_URL → Railway URL
- [x] `client.ts`: fallback + refresh flow uses NEXT_PUBLIC_API_URL (Railway, no localhost)

### Verification
- [x] Web typecheck (`npx tsc --noEmit`) — passed
- [x] API build (`pnpm --filter @platform/api build`) — `nest build` passed
- [x] Web production build (`pnpm --filter @platform/web build`) — passed (47 pages, lint + types OK)
