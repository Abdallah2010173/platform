CREATE TABLE "course_access_codes" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "maxUses" INTEGER NOT NULL DEFAULT 1,
  "usedCount" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "course_access_codes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "course_access_code_redemptions" (
  "id" TEXT NOT NULL,
  "codeId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "course_access_code_redemptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "course_access_codes_codeHash_key" ON "course_access_codes"("codeHash");
CREATE UNIQUE INDEX "course_access_code_redemptions_codeId_studentId_key" ON "course_access_code_redemptions"("codeId", "studentId");
CREATE INDEX "course_access_codes_courseId_deletedAt_idx" ON "course_access_codes"("courseId", "deletedAt");
CREATE INDEX "course_access_codes_createdBy_createdAt_idx" ON "course_access_codes"("createdBy", "createdAt");
CREATE INDEX "course_access_code_redemptions_studentId_redeemedAt_idx" ON "course_access_code_redemptions"("studentId", "redeemedAt");

ALTER TABLE "course_access_codes" ADD CONSTRAINT "course_access_codes_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_access_codes" ADD CONSTRAINT "course_access_codes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "course_access_code_redemptions" ADD CONSTRAINT "course_access_code_redemptions_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "course_access_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_access_code_redemptions" ADD CONSTRAINT "course_access_code_redemptions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
