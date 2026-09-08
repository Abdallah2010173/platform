ALTER TABLE "lesson_videos"
  ADD COLUMN "sourceKey" TEXT,
  ADD COLUMN "manifestKey" TEXT,
  ADD COLUMN "encryptionKey" TEXT,
  ADD COLUMN "processingError" TEXT;