-- ─────────────────────────────────────────────────────────────────────────────
-- Remove MODERATOR & SUPER_ADMIN roles
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Drop the moderators table (and its dependent FKs were ON DELETE CASCADE)
DROP TABLE IF EXISTS "moderators";

-- 2. Drop the isSuper column from admins
ALTER TABLE "admins" DROP COLUMN IF EXISTS "isSuper";

-- 3. Rebuild the Role enum without SUPER_ADMIN and MODERATOR values.
--    PostgreSQL does not support removing enum values directly, so we create a
--    new enum type, migrate existing rows, and swap the type.
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'TEACHER', 'STUDENT');

-- Map existing rows to the new enum (SUPER_ADMIN -> ADMIN, MODERATOR -> STUDENT)
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING (
  CASE "role"
    WHEN 'SUPER_ADMIN' THEN 'ADMIN'::text
    WHEN 'MODERATOR' THEN 'STUDENT'::text
    ELSE "role"::text
  END
)::"Role_new";

-- role_permissions.role uses the enum too
ALTER TABLE "role_permissions" ALTER COLUMN "role" TYPE "Role_new" USING (
  CASE "role"
    WHEN 'SUPER_ADMIN' THEN 'ADMIN'::text
    WHEN 'MODERATOR' THEN 'STUDENT'::text
    ELSE "role"::text
  END
)::"Role_new";

DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";
