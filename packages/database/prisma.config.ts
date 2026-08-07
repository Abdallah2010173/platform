import * as fs from 'fs';
import * as path from 'path';
import { config as loadEnv } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

/**
 * Load the monorepo root `.env` file so `DATABASE_URL` is available to the
 * Prisma CLI (migrate, db push, generate, studio) regardless of the working
 * directory the command is invoked from.
 */
function loadRootEnv(): void {
  const candidates = [
    // packages/database -> packages -> repo root
    path.resolve(__dirname, '../../.env'),
    path.resolve(process.cwd(), '../../.env'),
    path.resolve(process.cwd(), '.env'),
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        loadEnv({ path: candidate });
        return;
      }
    } catch {
      // ignore — environment may already be injected
    }
  }
}

loadRootEnv();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  engine: 'classic',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
