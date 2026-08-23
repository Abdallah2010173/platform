ALTER TABLE "exams" ADD COLUMN "resourceType" TEXT;
ALTER TABLE "exams" ADD COLUMN "resourceUrl" TEXT;

CREATE TABLE "surveys" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "externalUrl" TEXT NOT NULL,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "surveys_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "surveys_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "surveys_courseId_isPublished_idx" ON "surveys"("courseId", "isPublished");
CREATE INDEX "surveys_createdBy_idx" ON "surveys"("createdBy");
