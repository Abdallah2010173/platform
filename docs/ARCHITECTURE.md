# Architecture — Platform LMS

## Overview

Platform LMS follows **Clean Architecture** with a monorepo structure. The backend enforces strict layer separation; the frontend uses feature-based organization within the App Router.

## Monorepo Layout

```
platform/
├── apps/api          NestJS REST API
├── apps/web          Next.js 15 SPA/SSR
├── packages/database Prisma ORM + migrations
└── packages/shared   Cross-package types and constants
```

## Backend Layers

### Domain (`apps/api/src/domain/`)

Pure TypeScript interfaces and contracts. No framework dependencies.

- `repositories/` — Repository interfaces (IUserRepository, etc.)
- `services/` — Service interfaces (IAuthService, etc.)

### Application (`apps/api/src/application/`)

Business logic orchestration. Depends only on domain interfaces.

- `services/` — AuthService and future use-case services

### Infrastructure (`apps/api/src/infrastructure/`)

External system implementations.

- `database/` — PrismaModule, PrismaService
- `repositories/` — Concrete repository implementations
- `config/` — Environment validation

### Presentation (`apps/api/src/presentation/`)

HTTP/API layer.

- `modules/` — Feature modules (auth, health, future: courses, users)
- `guards/` — JwtAuthGuard, RolesGuard
- `decorators/` — @Public(), @Roles(), @CurrentUser()
- `strategies/` — Passport JWT strategy

## Authentication Flow

```
Client                    API                         Database
  │                        │                              │
  ├── POST /auth/login ───►│                              │
  │                        ├── validateUser() ───────────►│
  │                        │◄── user record ──────────────│
  │                        ├── generateTokens()            │
  │                        │   ├── sign access JWT         │
  │                        │   └── store refresh token ──►│
  │◄── { accessToken, refreshToken } ──│                 │
  │                        │                              │
  ├── GET /auth/me ───────►│                              │
  │   Authorization: Bearer│                              │
  │                        ├── JwtAuthGuard validates      │
  │                        ├── JwtStrategy loads user ────►│
  │◄── user profile ───────│                              │
```

### Refresh Token Rotation

1. Client sends refresh token to `POST /auth/refresh`
2. Server verifies JWT signature and looks up stored token
3. If token was already revoked → revoke entire token family (reuse detection)
4. Old token revoked, new pair issued with same family ID

## RBAC Model

Permissions are stored in the database and mapped to roles via `role_permissions`.

```
Permission (resource + action)  ←──  RolePermission  ──→  Role enum on User
```

Guards:

- `JwtAuthGuard` — Validates JWT on all routes except `@Public()`
- `RolesGuard` — Checks `@Roles(Role.ADMIN, ...)` decorator

## Database Schema (Phase 1)

| Model | Purpose |
|---|---|
| User | Core identity, role, auth state |
| Profile | User display info |
| RefreshToken | JWT refresh token storage with family tracking |
| OAuthAccount | Social login accounts (schema ready) |
| Permission | Resource-action permission definitions |
| RolePermission | Role-to-permission mapping |
| AuditLog | Activity tracking |
| EmailVerificationToken | Email verification (schema ready) |
| PasswordResetToken | Password reset (schema ready) |

## Frontend Architecture

```
apps/web/src/
├── app/              Next.js App Router (pages, layouts)
├── components/
│   ├── ui/           shadcn/ui primitives
│   └── providers/    Theme, Redux, React Query
└── lib/
    ├── api/          Axios client with interceptors
    └── store/        Redux Toolkit slices
```

State management:

- **Redux Toolkit** — Auth state (user, tokens)
- **React Query** — Server state (future API data)
- **React Hook Form + Zod** — Form validation

## Environment Variables

All secrets are loaded from `.env` at the monorepo root. The API validates required variables at startup via `validateEnv()`.

See `.env.example` for the complete list.

## Docker Services

| Service | Port | Purpose |
|---|---|---|
| postgres | 5432 | Primary database |
| redis | 6379 | Caching, sessions (Phase 2+) |

## Future Module Placeholders

The following module directories are reserved for Phase 2+:

```
apps/api/src/presentation/modules/
├── auth/       ✅ Phase 1
├── health/     ✅ Phase 1
├── users/      Phase 2
├── courses/    Phase 2
├── exams/      Phase 4
├── bookings/   Phase 3
├── payments/   Phase 5
├── messaging/  Phase 6
└── admin/      Phase 2
```
