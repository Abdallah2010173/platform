CREATE TYPE "LessonContentBlockType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'PDF', 'FILE', 'EMBED');

CREATE TABLE "lesson_content_blocks" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "type" "LessonContentBlockType" NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "title" TEXT,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "lesson_content_blocks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lesson_content_blocks_lessonId_orderIndex_key" ON "lesson_content_blocks"("lessonId", "orderIndex");
CREATE INDEX "lesson_content_blocks_lessonId_deletedAt_idx" ON "lesson_content_blocks"("lessonId", "deletedAt");

ALTER TABLE "lesson_content_blocks"
ADD CONSTRAINT "lesson_content_blocks_lessonId_fkey"
FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;