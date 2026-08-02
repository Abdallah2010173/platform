# Platform LMS — Enterprise Learning Management System

Phase 1 foundation: monorepo, authentication architecture, database schema, Docker, and frontend shell.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS v4, shadcn/ui |
| Backend | NestJS, TypeScript, Prisma ORM |
| Database | PostgreSQL 16 |
| Cache | Redis 7 (ready for Phase 2) |
| Auth | JWT access + refresh tokens, RBAC |
| Monorepo | pnpm workspaces, Turbo |

## Project Structure

```
platform/
├── apps/
│   ├── api/                    # NestJS backend (Clean Architecture)
│   │   └── src/
│   │       ├── domain/         # Entities, repository interfaces
│   │       ├── application/    # Use cases, services
│   │       ├── infrastructure/ # Prisma, repositories, config
│   │       └── presentation/   # Controllers, guards, DTOs
│   └── web/                    # Next.js 15 frontend
│       └── src/
│           ├── app/            # App Router pages
│           ├── components/     # UI components (shadcn/ui)
│           └── lib/            # API client, store, utils
├── packages/
│   ├── database/               # Prisma schema, migrations, seed
│   └── shared/                 # Shared types, enums, constants
├── docker-compose.yml          # PostgreSQL + Redis
└── .env.example                # Environment template
```

## Prerequisites

- Node.js >= 20
- pnpm >= 9
- Docker & Docker Compose

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Update secrets in `.env` before production use.

### 3. Start infrastructure

```bash
pnpm docker:up
```

### 4. Run database migrations and seed

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### 5. Start development servers

```bash
pnpm dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:4000/api/v1 |
| Swagger Docs | http://localhost:4000/docs |
| Prisma Studio | `pnpm db:studio` |

## Default Super Admin

| Field | Value |
|---|---|
| Email | admin@platform.local |
| Password | SuperAdmin@123 |

**Change this password immediately in production.**

## User Roles

| Role | Description |
|---|---|
| `SUPER_ADMIN` | Full system access, role management |
| `ADMIN` | User and course management, audit logs |
| `TEACHER` | Create and manage own courses |
| `STUDENT` | Enroll and consume courses |
| `MODERATOR` | User moderation, content review |

## API Endpoints (Phase 1)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/auth/login` | Login, receive JWT tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Revoke refresh token |
| GET | `/api/v1/auth/me` | Current user (requires JWT) |

## Scripts

```bash
pnpm dev              # Start all apps in dev mode
pnpm build            # Build all packages
pnpm lint             # Lint all packages
pnpm typecheck        # TypeScript check
pnpm format           # Prettier format
pnpm docker:up        # Start PostgreSQL + Redis
pnpm docker:down      # Stop containers
pnpm db:generate      # Generate Prisma client
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed roles, permissions, super admin
pnpm db:studio        # Open Prisma Studio
```

## Clean Architecture (API)

```
presentation/  →  HTTP layer (controllers, guards, DTOs)
application/   →  Business logic (services, use cases)
domain/        →  Core interfaces (repository contracts)
infrastructure/→  External concerns (Prisma, config, repos)
```

Dependency rule: outer layers depend on inner layers, never the reverse.

## Phase 1 Checklist

- [x] Monorepo with pnpm + Turbo
- [x] NestJS API with Clean Architecture
- [x] Next.js 15 frontend with Tailwind + shadcn/ui
- [x] PostgreSQL + Prisma schema
- [x] Docker Compose (PostgreSQL, Redis)
- [x] ESLint, Prettier, TypeScript
- [x] User roles (5 roles)
- [x] RBAC permissions seed
- [x] JWT auth architecture (access + refresh)
- [x] Environment variables template
- [x] Health check endpoint
- [x] Swagger documentation

## Next Phase

Phase 2 will add: course management, categories, chapters, lessons, file uploads, and enrollment.

**Awaiting approval before continuing.**
