/*
  Warnings:

  - You are about to drop the column `isPublished` on the `course_chapters` table. All the data in the column will be lost.
  - You are about to drop the column `orderIndex` on the `course_chapters` table. All the data in the column will be lost.
  - The `status` column on the `course_students` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[courseId,slug]` on the table `course_chapters` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[courseId,sortOrder]` on the table `course_chapters` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[chapterId,slug]` on the table `lessons` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `course_chapters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `courseId` to the `lessons` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `lessons` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "VideoQuality" AS ENUM ('AUTO', 'SD', 'HD', 'FULL_HD', 'UHD');

-- CreateEnum
CREATE TYPE "ChapterStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "ChapterVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'UNLISTED');

-- CreateEnum
CREATE TYPE "LessonStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "LessonVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'UNLISTED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'DROPPED', 'PAUSED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ResourceCategoryType" AS ENUM ('GENERAL', 'DOCUMENT', 'VIDEO', 'AUDIO', 'IMAGE', 'ARCHIVE', 'LINK');

-- AlterEnum
ALTER TYPE "LessonType" ADD VALUE 'ASSIGNMENT';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "VideoSource" ADD VALUE 'BUNNY';
ALTER TYPE "VideoSource" ADD VALUE 'EMBED';

-- DropIndex
DROP INDEX "course_chapters_courseId_idx";

-- DropIndex
DROP INDEX "course_chapters_courseId_orderIndex_key";

-- AlterTable
ALTER TABLE "course_chapters" DROP COLUMN "isPublished",
DROP COLUMN "orderIndex",
ADD COLUMN     "chapterNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "coverImage" TEXT,
ADD COLUMN     "estimatedDuration" INTEGER,
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPreview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "ChapterStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "visibility" "ChapterVisibility" NOT NULL DEFAULT 'PUBLIC';

-- AlterTable
ALTER TABLE "course_students" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "canceledAt" TIMESTAMP(3),
ADD COLUMN     "certificateEligible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "certificateIssuedAt" TIMESTAMP(3),
ADD COLUMN     "isFavorite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastAccessedAt" TIMESTAMP(3),
ADD COLUMN     "lastLessonId" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "lesson_videos" ADD COLUMN     "captions" JSONB,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "hasWatermark" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPreview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "quality" "VideoQuality" NOT NULL DEFAULT 'AUTO',
ADD COLUMN     "resolution" TEXT,
ADD COLUMN     "watermarkUrl" TEXT;

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "courseId" TEXT NOT NULL,
ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPreview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lessonNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "status" "LessonStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "visibility" "LessonVisibility" NOT NULL DEFAULT 'PUBLIC',
ALTER COLUMN "type" SET DEFAULT 'VIDEO',
ALTER COLUMN "orderIndex" SET DEFAULT 0,
ALTER COLUMN "isPublished" SET DEFAULT false;

-- CreateTable
CREATE TABLE "course_resources" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT,
    "category" "ResourceCategoryType" NOT NULL DEFAULT 'GENERAL',
    "url" TEXT,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileSize" BIGINT,
    "mimeType" TEXT,
    "content" TEXT,
    "isExternal" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "course_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_progress" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "watchedSeconds" INTEGER NOT NULL DEFAULT 0,
    "lastPositionMs" INTEGER NOT NULL DEFAULT 0,
    "attemptsCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapter_progress" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "lessonsCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalLessons" INTEGER NOT NULL DEFAULT 0,
    "percentComplete" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "lastLessonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "chapter_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollment_activities" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "lessonId" TEXT,
    "chapterId" TEXT,
    "activityType" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "enrollment_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_resources_courseId_category_idx" ON "course_resources"("courseId", "category");

-- CreateIndex
CREATE INDEX "course_resources_courseId_isPublished_idx" ON "course_resources"("courseId", "isPublished");

-- CreateIndex
CREATE INDEX "lesson_progress_lessonId_idx" ON "lesson_progress"("lessonId");

-- CreateIndex
CREATE INDEX "lesson_progress_studentId_idx" ON "lesson_progress"("studentId");

-- CreateIndex
CREATE INDEX "lesson_progress_courseId_idx" ON "lesson_progress"("courseId");

-- CreateIndex
CREATE INDEX "lesson_progress_status_idx" ON "lesson_progress"("status");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_progress_enrollmentId_lessonId_key" ON "lesson_progress"("enrollmentId", "lessonId");

-- CreateIndex
CREATE INDEX "chapter_progress_chapterId_idx" ON "chapter_progress"("chapterId");

-- CreateIndex
CREATE INDEX "chapter_progress_studentId_idx" ON "chapter_progress"("studentId");

-- CreateIndex
CREATE INDEX "chapter_progress_courseId_idx" ON "chapter_progress"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "chapter_progress_enrollmentId_chapterId_key" ON "chapter_progress"("enrollmentId", "chapterId");

-- CreateIndex
CREATE INDEX "enrollment_activities_enrollmentId_createdAt_idx" ON "enrollment_activities"("enrollmentId", "createdAt");

-- CreateIndex
CREATE INDEX "enrollment_activities_studentId_idx" ON "enrollment_activities"("studentId");

-- CreateIndex
CREATE INDEX "enrollment_activities_courseId_idx" ON "enrollment_activities"("courseId");

-- CreateIndex
CREATE INDEX "enrollment_activities_lessonId_idx" ON "enrollment_activities"("lessonId");

-- CreateIndex
CREATE INDEX "enrollment_activities_activityType_idx" ON "enrollment_activities"("activityType");

-- CreateIndex
CREATE INDEX "course_chapters_courseId_status_idx" ON "course_chapters"("courseId", "status");

-- CreateIndex
CREATE INDEX "course_chapters_courseId_visibility_idx" ON "course_chapters"("courseId", "visibility");

-- CreateIndex
CREATE UNIQUE INDEX "course_chapters_courseId_slug_key" ON "course_chapters"("courseId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "course_chapters_courseId_sortOrder_key" ON "course_chapters"("courseId", "sortOrder");

-- CreateIndex
CREATE INDEX "course_students_studentId_status_idx" ON "course_students"("studentId", "status");

-- CreateIndex
CREATE INDEX "course_students_status_idx" ON "course_students"("status");

-- CreateIndex
CREATE INDEX "course_students_isFavorite_idx" ON "course_students"("isFavorite");

-- CreateIndex
CREATE INDEX "lessons_courseId_idx" ON "lessons"("courseId");

-- CreateIndex
CREATE INDEX "lessons_status_idx" ON "lessons"("status");

-- CreateIndex
CREATE UNIQUE INDEX "lessons_chapterId_slug_key" ON "lessons"("chapterId", "slug");

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_resources" ADD CONSTRAINT "course_resources_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_resources" ADD CONSTRAINT "course_resources_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "course_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapter_progress" ADD CONSTRAINT "chapter_progress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "course_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapter_progress" ADD CONSTRAINT "chapter_progress_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "course_chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapter_progress" ADD CONSTRAINT "chapter_progress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapter_progress" ADD CONSTRAINT "chapter_progress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_activities" ADD CONSTRAINT "enrollment_activities_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "course_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_activities" ADD CONSTRAINT "enrollment_activities_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_activities" ADD CONSTRAINT "enrollment_activities_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_activities" ADD CONSTRAINT "enrollment_activities_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_activities" ADD CONSTRAINT "enrollment_activities_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "course_chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
