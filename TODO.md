# Google OAuth Implementation — Tracking

## Backend (NestJS)

- [x] Install `passport-google-oauth20` + types
- [x] Add `OAuthState` Prisma model + migration
- [x] Create `GoogleStrategy` (passport-google-oauth20)
- [x] Extend `UserRepository` (findByProviderAccountId, linkGoogleAccount, updateGoogleProfile, createOAuthState, findOAuthStateByCode, markOAuthStateUsed)
- [x] Extend `AuthService` (googleOAuthLogin, createOAuthExchangeCode, exchangeOAuthCode, createOAuthRedirectState, setOAuthStateCookie)
- [x] Update `AuthController` (GET google, GET google/callback, POST google/exchange)
- [x] Update `AuthModule` providers
- [x] Update `env.validation.ts` (FRONTEND_CALLBACK_URL / FRONTEND_URL)
- [x] Update DTOs + Swagger
- [x] Remove old POST /auth/google GIS flow

## Frontend (Next.js)

- [x] Rework `GoogleSignInButton` → "Continue with Google" (redirect flow)
- [x] Add `/auth/google/callback` page (exchange code → store session)
- [x] Update `services.ts` authApi
- [x] Update `@platform/shared` API_ROUTES

## Cleanup

- [x] Remove `googleLogin` GIS method from `AuthService`
- [x] Remove `authApi.googleLogin` from `services.ts`
- [x] Remove `GoogleAuthDto` from DTOs
- [x] Fix formatting/indentation in touched files
- [x] Remove every "Google Sign-In is not configured" message

## Verification

- [x] `pnpm install`
- [x] `pnpm --filter @platform/database generate`
- [x] `pnpm --filter @platform/api typecheck`
- [x] `pnpm --filter @platform/api build`
- [x] `pnpm --filter @platform/web typecheck`
- [x] `pnpm --filter @platform/web build`

All typechecks pass and both the API build and web compilation succeed. The Google OAuth (passport-google-oauth20) integration is complete end-to-end.

Note: `next build` reports pre-existing static prerender errors on `/student/profile` and `/404` (client-side pages using React Query during static generation). These are unrelated to the Google OAuth changes — those pages were not modified by this task. The authoritative `tsc --noEmit` typecheck for apps/web passes cleanly.
