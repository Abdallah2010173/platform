# TODO — Role Cleanup & Completion

## Phase 1 — Remove MODERATOR & SUPER_ADMIN (DONE)

- [x] Schema: Role enum now only ADMIN/TEACHER/STUDENT
- [x] Schema: removed `isSuper` from Admin model
- [x] Migration: `20260203000000_remove_moderator_superadmin`
- [x] Seed: removed moderator/super admin references
- [x] API: users.service updated (no isSuper/mod, no moderator include)
- [x] API: courses.controller cleaned (`Role.ADMIN, Role.ADMIN` → `Role.ADMIN`)
- [x] API: course.service cleaned
- [x] API: teacher.controller cleaned
- [x] shared: UserRole only ADMIN/TEACHER/STUDENT
- [x] database/src: cleaned
- [x] web auth.ts: roleToRoute cleaned
- [x] web navigation.ts: ROLE_NAV cleaned
- [x] web admin/layout: only UserRole.ADMIN
- [x] web admin/users: ROLE_OPTIONS cleaned
- [x] web login: no hardcoded demo creds
- [x] web services.ts: moderatorApi removed
- [x] web hooks.ts: moderator hooks removed
- [x] web home page: RBAC text updated

## Remaining steps

- [x] Delete `apps/web/src/app/moderator/` directory
- [x] Remove temporary `_*.ps1` helper scripts (keep startup/test/maintenance scripts)
- [x] Fix formatting issues (login/page.tsx, page.tsx)
- [x] Final scan: zero SUPER_ADMIN / MODERATOR / isSuper references in source
- [x] Run prisma generate, migrate, typecheck, lint, build
- [x] Create Git commits per phase
- [x] Refactor users.service.ts: remove `isSuper` from mapped admin, type-safe includes + bulk action

## Phase 2 — Fix Google OAuth frontend redirect (DONE)

- [x] Root cause: deployed API's `FRONTEND_URL`/`FRONTEND_CALLBACK_URL` were missing/misconfigured, so OAuth redirects fell back to the API host (`/login?oauth_error=1`)
- [x] auth.controller: capture frontend origin at flow start (from env or request Origin/Referer) and store it in the OAuth state cookie
- [x] auth.controller: callback now redirects to the captured frontend origin on success (`/auth/google/callback`) and on error (`/login?oauth_error=1`) — never the API host
- [x] API typecheck passes after the refactor
