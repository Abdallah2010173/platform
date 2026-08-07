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

## Deployment (Production)

The app is deployed via **Railway** (`railway.json`). The deploy pipeline is:

1. **Build**: `pnpm install && pnpm build` (runs `prisma generate` via the database package's `prebuild`).
2. **Start**: `pnpm --filter @platform/api start:prod`, which first runs `prisma migrate deploy`
   (via the `prestart:prod` hook) and then starts `node dist/main`.

### `DATABASE_URL` is required

Prisma reads `DATABASE_URL` from the schema (`url = env("DATABASE_URL")`) and from the driver
adapter at runtime. If it is missing or malformed, you will see:

```
Error validating datasource `db`: the URL must start with the protocol `postgresql://` or `postgres://`.
```

**Root cause when this happens:** `DATABASE_URL` is not present in the process environment at
container start. The `.env` file is gitignored and **not shipped in the image**, so you **must**
inject `DATABASE_URL` via your platform's environment configuration:

- **Railway**: add a `DATABASE_URL` variable in the service's Variables/Secrets (from a Postgres
  plugin or a real external connection string).
- **Docker Compose**: set it via the `environment:` block / `-e` flag.
- **Kubernetes**: use a Secret mounted as an env var.

The database package's `loadEnv()` will load `.env` from the monorepo root when present (local dev),
and fails fast with a clear message if `DATABASE_URL` is missing or doesn't start with
`postgresql://` / `postgres://`. No URL is hardcoded anywhere.

Make sure the value is a real connection string:

```
postgresql://USER:PASSWORD@HOST:PORT/DBNAME
```

Do **not** include literal quotes or a placeholder like `changeme`. Add `?sslmode=require` (or
similar) if your managed Postgres provider requires it.

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
// test
