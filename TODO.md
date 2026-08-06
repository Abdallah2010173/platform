# LMS Production-Readiness Audit — Progress

## Phase 1: Functional fixes & CRUD implementation — DONE

### Dashboard stats (real data)
- [x] **Admin dashboard stats** — Real API fields mapped (`total`, `students`, `teachers`, `published`, `total` courses) in `admin/page.tsx`.
- [x] **Admin analytics** — Field mapping fixed in `admin/analytics/page.tsx`.
- [x] **Moderator dashboard** — Replaced admin-only endpoints (403) with `useModeratorStats` in `moderator/page.tsx`.
- [x] **Moderator analytics** — Replaced admin-only endpoints with `useModeratorStats` in `moderator/analytics/page.tsx`.
- [x] **Teacher dashboard & analytics** — Real stats fields mapped in `teacher/page.tsx` & `teacher/analytics/page.tsx`.

### CRUD
- [x] **Admin Users CRUD** — Create/edit user modal, activate/deactivate, role change, reset password in `admin/users/page.tsx`.
- [x] **Admin Categories CRUD** — Create/edit/delete in `admin/categories/page.tsx`.
- [x] **Admin Courses CRUD** — Create/edit/delete/publish actions in `admin/courses/page.tsx`.

## Phase 2: Integrations

### Google OAuth — DONE
- [x] **Google OAuth login/signup** — `GoogleSignInButton` on login & register pages; backend `@Post('auth/google')` route auto-creates user on first login.

### Theme system — DONE
- [x] **Theme persistence** — Light/Dark/System + accent color saved in localStorage & applied on load (already present).

### Notification center — DONE
- [x] **Notification bell wired** — Replaced broken placeholder bell in `header.tsx` with functional `NotificationCenter`.
- [x] **Mark as read / mark all read** — Mutations call real backend endpoints for student & teacher roles.
- [x] **Unread badge** — Shows real unread count from backend.

### Remaining (require real external credentials/services)
- [ ] **Google Calendar integration** — Backend service + "Add to Google Calendar" one-click (needs OAuth creds).
- [ ] **Zoom integration** — Backend service for create/start/end/record meetings (needs Zoom app creds).
- [ ] **Email provider** — Verification, password reset, enrollment, booking, reminders, certificate emails (SMTP configured in env).
- [ ] **Push notifications** — Future-ready channel (in-app + email already wired).

## Verification
- [x] `pnpm typecheck` passes (forced full run: 6/6 successful)
- [ ] `pnpm lint` passes (resolve warnings)
- [ ] `pnpm build` succeeds
