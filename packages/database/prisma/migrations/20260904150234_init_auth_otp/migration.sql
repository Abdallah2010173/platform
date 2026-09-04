-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('EMAIL', 'GOOGLE', 'BOTH');

-- CreateEnum
CREATE TYPE "AccessType" AS ENUM ('FREE', 'PAID', 'TEACHER_GRANTED', 'ADMIN_GRANTED');

-- DropIndex
DROP INDEX "courses_categoryId_isPublished_idx";

-- DropIndex
DROP INDEX "courses_createdBy_idx";

-- DropIndex
DROP INDEX "courses_level_idx";

-- DropIndex
DROP INDEX "courses_status_isPublished_idx";

-- DropIndex
DROP INDEX "courses_subCategoryId_idx";

-- DropIndex
DROP INDEX "courses_subjectId_idx";

-- DropIndex
DROP INDEX "courses_title_idx";

-- AlterTable
ALTER TABLE "course_students" ADD COLUMN     "accessGrantedAt" TIMESTAMP(3),
ADD COLUMN     "accessGrantedBy" TEXT,
ADD COLUMN     "accessType" "AccessType" NOT NULL DEFAULT 'FREE';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "courseId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "authProvider" "AuthProvider" NOT NULL DEFAULT 'EMAIL',
ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "codeExpiresAt" TIMESTAMP(3),
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verificationCode" TEXT;

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "courseId" TEXT,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "audience" TEXT NOT NULL DEFAULT 'ALL',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "announcements_courseId_idx" ON "announcements"("courseId");

-- CreateIndex
CREATE INDEX "announcements_authorId_idx" ON "announcements"("authorId");

-- CreateIndex
CREATE INDEX "announcements_audience_publishedAt_idx" ON "announcements"("audience", "publishedAt");

-- CreateIndex
CREATE INDEX "course_students_accessType_idx" ON "course_students"("accessType");

-- CreateIndex
CREATE INDEX "payments_courseId_idx" ON "payments"("courseId");

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_students" ADD CONSTRAINT "course_students_accessGrantedBy_fkey" FOREIGN KEY ("accessGrantedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
