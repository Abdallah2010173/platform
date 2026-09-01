-- Add the missing nullable password column required by the current Prisma User model.
-- This is a safe additive migration for the existing PostgreSQL database and does not
-- delete or mutate user records, roles, or other application data.
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "password" TEXT;
