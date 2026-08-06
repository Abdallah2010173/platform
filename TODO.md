# TODO — Fix DATABASE_URL loading + production-ready Prisma pipeline (Prisma 6.19.3)

## Goal
Make the project production-ready by ensuring Prisma always loads `DATABASE_URL`
from the correct `.env` file, failing fast with a clear message when it's missing,
and wiring Prisma generate/migrate into the build & start pipeline — without
hardcoding any URL and without upgrading to Prisma 7.

## Steps
- [x] Analyze root cause: `packages/database/src/index.ts` constructs Prisma with
      `process.env.DATABASE_URL` at import time but never loads `.env`
- [x] 1. `packages/database/src/load-env.ts` — new helper that loads `.env` from the
         monorepo root and validates `DATABASE_URL` (fail-fast, no hardcoded URL)
- [x] 2. `packages/database/src/index.ts` — call `loadEnv()` before constructing the
         Prisma client and use `getDatabaseUrl()` for the adapter connection string
- [x] 3. `packages/database/prisma/seed.ts` — use the same `loadEnv()` + `getDatabaseUrl()`
         (replaces bare `import 'dotenv/config'`)
- [x] 4. `apps/api/package.json` — add `prestart:prod` running `prisma generate` +
         `prisma migrate deploy` before `node dist/main`
- [x] 5. `.env.example` — document required vars + production injection note
- [x] 6. `README.md` — document deployment env-var requirement + new start pipeline
- [x] 7. Run `pnpm --filter @platform/database build` + `typecheck` — **PASS, zero errors**
- [x] 8. Run `pnpm --filter @platform/api build` — **PASS, zero Prisma/DATABASE_URL errors**
         (`apps/api/dist/main.js` and `packages/database/dist/load-env.js` both generated)

## Notes
- Prisma remains pinned to 6.19.3 (`prisma`, `@prisma/client`, `@prisma/adapter-pg`).
- No `prisma.config.ts` added (Prisma 7-only, would break Prisma 6 `generate`).
- No database URL is hardcoded anywhere.
- `loadEnv()` resolves `.env` from repo root (`packages/database/dist` → `../../../.env`),
  falling back to `process.cwd()/.env`.
</content>
