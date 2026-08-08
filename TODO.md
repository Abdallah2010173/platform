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
