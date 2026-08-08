# Production Google OAuth Fix — Implementation Steps

## Goal
Fix the Google OAuth flow so the API authenticates the user, generates JWTs, and
redirects **only** to the frontend domain. Never redirect to `/login` on the API host
(which produced `Cannot GET /login?oauth_error=1`).

## Root cause
The API's `googleCallback` error path fell back to a **relative** redirect
`res.redirect('/login?oauth_error=1')`. Relative redirects resolve against the
current host — the API — producing `https://<api-domain>/login?oauth_error=1`.
The API has no `/login` page (it's a frontend route), so Express returned
`Cannot GET /login?oauth_error=1`.

## Steps
- [x] 1. env.validation.ts: make FRONTEND_URL, FRONTEND_CALLBACK_URL, API_URL, GOOGLE_CALLBACK_URL required.
- [x] 2. auth.controller.ts: googleCallback redirects only to frontend (success + failure), never relative `/login`.
- [x] 3. main.ts: fix CORS for production cross-origin token exchange (credentials + explicit origin).
- [x] 4. web google-signin-button.tsx: derive Google redirect URL from NEXT_PUBLIC_API_URL (no hardcoded Railway URL).
- [x] 5. web client.ts: remove hardcoded Railway fallback; use NEXT_PUBLIC_API_URL.
- [x] 6. Check root/workspace .env files and remove any hardcoded localhost/Railway URLs in source.
- [x] 7. Update web `.env.example` with required NEXT_PUBLIC_* vars.
- [ ] 8. Run API typecheck/build and web typecheck/lint/build.
- [ ] 9. Document Railway env vars + Google Cloud Console redirect URI checklist.
