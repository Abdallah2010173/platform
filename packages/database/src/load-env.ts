import * as path from 'path';
import * as fs from 'fs';
import { config as loadDotenv } from 'dotenv';

/**
 * Resolve the absolute path to the monorepo root `.env` file.
 *
 * The database package lives at `packages/database`, so the root is three
 * directories up: `packages/database` -> `packages` -> repo root.
 */
function resolveRootEnvPath(): string | undefined {
  const candidates = [
    // packages/database/dist, packages/database/src, packages/database
    path.resolve(__dirname, '../../../.env'),
    path.resolve(process.cwd(), '.env'),
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    } catch {
      // ignore
    }
  }
  return undefined;
}

/**
 * Load `.env` from the monorepo root into process.env (if present).
 * This must run before constructing the Prisma client so that
 * `process.env.DATABASE_URL` is always populated, regardless of how the
 * process is started (local dev, `node dist/main`, or a container).
 */
export function loadEnv(): void {
  const envPath = resolveRootEnvPath();
  if (envPath) {
    try {
      loadDotenv({ path: envPath });
    } catch (err) {
      // dotenv is only used to load a file if it exists; a failure here is
      // non-fatal because the environment may already be injected.
      console.warn('[platform/database] Warning: could not load .env file:', err);
    }
  }
}

/**
 * Validate that DATABASE_URL is present and well-formed for Prisma.
 * Throws a clear error early instead of letting Prisma fail obscurely.
 */
export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;

  if (!url || url.trim() === '') {
    throw new Error(
      [
        'DATABASE_URL is missing or empty.',
        '',
        'Set DATABASE_URL to a valid PostgreSQL connection string, e.g.:',
        '  postgresql://USER:PASSWORD@HOST:PORT/DBNAME',
        '',
        'For local development, ensure the monorepo root `.env` file sets it',
        '(loadEnv() looks for `.env` at the repo root).',
        '',
        "For production, inject it via your platform's environment",
        '(Railway/Docker -e/Kubernetes secret) — a .env file is not shipped in the image.',
      ].join('\n'),
    );
  }

  const trimmed = url.trim();

  if (!/^postgres(ql)?:\/\//i.test(trimmed)) {
    throw new Error(
      [
        'DATABASE_URL must start with "postgresql://" or "postgres://".',
        `Received: ${maskUrl(trimmed)}`,
        '',
        'Check for stray quotes, whitespace, or a placeholder value in your',
        'environment / .env configuration.',
      ].join('\n'),
    );
  }

  return trimmed;
}

/** Mask credentials for safe error/log output. */
function maskUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = '***';
    }
    return parsed.toString();
  } catch {
    // Not a parseable URL — show a truncated representation.
    const max = 40;
    return url.length > max ? `${url.slice(0, max)}…` : url;
  }
}
