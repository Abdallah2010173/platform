# LMS Frontend Migration — TODO

## Phase 1: Design System + Layout

- [x] Analyze existing platform & platform-frontend
- [x] Port new globals.css (theme tokens, animations) into apps/web
- [x] Add missing shadcn/ui primitives (Sheet, etc.)
- [x] Create new role-aware Sidebar component
- [x] Create new Header component
- [x] Create MobileNav component
- [x] Create new DashboardLayout using new design
- [x] Update root layout (theme provider, fonts)
- [x] API services + hooks layer

## Phase 2: Authentication Pages

- [x] Login page (new design + Suspense fix + forgot/register links)
- [x] Register page
- [x] Forgot Password page
- [x] Reset Password page
- [x] Email Verification page
- [x] Logout page
- [x] JWT + refresh token flow preserved (existing client)

## Phase 3: Student Dashboard + pages

- [x] Dashboard
- [x] My Courses
- [x] Live Classes
- [x] Assignments
- [x] Exams
- [x] Grades
- [x] Schedule
- [x] Messages
- [x] Certificates
- [x] Profile
- [x] Settings (theme + color picker)
- [x] Help

## Phase 4: Teacher Dashboard + pages

- [x] Dashboard
- [x] Courses
- [x] Students
- [x] Assignments
- [x] Live Classes
- [x] Exams
- [x] Analytics
- [x] Availability
- [x] Profile
- [x] Settings (theme + color picker)
- [x] Help

## Phase 5: Admin Dashboard + pages

- [x] Dashboard
- [x] Users (CRUD)
- [x] Courses management
- [x] Categories
- [x] Analytics
- [x] Settings (theme + color picker)
- [x] Help

## Phase 6: Moderator pages

- [x] Dashboard
- [x] Courses
- [x] Categories
- [x] Analytics
- [x] Settings
- [x] Help

## Phase 7: Remaining pages

- [x] Landing page (homepage)
- [x] Theme settings (light/dark/system + 8 color picker)
- [x] Notifications (header bell)
- [x] Messages (chat)
- [x] Certificates
- [x] Profile

## Final

- [x] Remove platform-frontend reference folder (design system ported into apps/web) — ONLY ONE app remains
- [x] Backend, database, APIs, auth, RBAC preserved (untouched source of truth)
- [x] Full verification: typecheck passes, lint clean, build succeeds (46 routes)
- [x] Responsive layout (desktop/laptop/tablet/mobile via sidebar + mobile-nav sheet)
- [x] Theme persistence (localStorage, survives logout/login)

## Diagnostics cleanup

- [x] Create `.vscode/settings.json` to suppress false-positive `unknownAtRules` warnings for Tailwind v4 at-rules (`@plugin`, `@custom-variant`, `@theme`, `@apply`) in `globals.css`
- [x] Replace `min-h-[200px]` with canonical `min-h-50` in `data-states.tsx` (2 occurrences) as suggested by Tailwind IntelliSense
