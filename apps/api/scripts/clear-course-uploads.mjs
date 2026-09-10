import { DeleteObjectsCommand, S3Client } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';

if (process.env.CONFIRM_CLEAR_COURSE_UPLOADS !== 'YES') {
  throw new Error('Set CONFIRM_CLEAR_COURSE_UPLOADS=YES to permanently delete course uploads.');
}

const required = [
  'DATABASE_URL',
  'CLOUDFLARE_R2_ENDPOINT',
  'CLOUDFLARE_R2_ACCESS_KEY_ID',
  'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
  'CLOUDFLARE_R2_BUCKET_NAME',
];
for (const name of required) {
  if (!process.env[name]) throw new Error(`${name} is required`);
}

const prisma = new PrismaClient();
const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});
const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;

function keyFromValue(value) {
  if (!value || typeof value !== 'string') return null;
  if (value.startsWith('uploads/') || value.startsWith('videos/')) return value;
  try {
    const pathname = new URL(value).pathname.replace(/^\/+/, '');
    return pathname.startsWith('uploads/') || pathname.startsWith('videos/') ? pathname : null;
  } catch {
    return null;
  }
}

async function deleteObjects(keys) {
  const uniqueKeys = [...new Set(keys.filter(Boolean))];
  for (let index = 0; index < uniqueKeys.length; index += 1000) {
    const chunk = uniqueKeys.slice(index, index + 1000);
    if (!chunk.length) continue;
    await r2.send(new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: chunk.map((Key) => ({ Key })), Quiet: true },
    }));
  }
  return uniqueKeys.length;
}

try {
  const [videos, pdfs, attachments, lessonResources, courseResources] = await Promise.all([
    prisma.lessonVideo.findMany({ where: { source: 'UPLOAD' }, select: { url: true, sourceKey: true, manifestKey: true, encryptionKey: true } }),
    prisma.lessonPDF.findMany({ select: { url: true } }),
    prisma.lessonAttachment.findMany({ select: { fileUrl: true } }),
    prisma.lessonResource.findMany({ where: { isExternal: false }, select: { url: true } }),
    prisma.courseResource.findMany({ where: { OR: [{ isExternal: false }, { fileUrl: { not: null } }] }, select: { url: true, fileUrl: true } }),
  ]);

  const keys = [
    ...videos.flatMap((item) => [item.url, item.sourceKey, item.manifestKey, item.encryptionKey]),
    ...pdfs.map((item) => item.url),
    ...attachments.map((item) => item.fileUrl),
    ...lessonResources.map((item) => item.url),
    ...courseResources.flatMap((item) => [item.url, item.fileUrl]),
  ].map(keyFromValue);

  await prisma.$transaction([
    prisma.lessonVideo.deleteMany({ where: { source: 'UPLOAD' } }),
    prisma.lessonPDF.deleteMany(),
    prisma.lessonAttachment.deleteMany(),
    prisma.lessonResource.deleteMany({ where: { isExternal: false } }),
    prisma.courseResource.deleteMany({ where: { OR: [{ isExternal: false }, { fileUrl: { not: null } }] } }),
  ]);

  const deletedObjects = await deleteObjects(keys);
  console.log(`Deleted course content records and ${deletedObjects} R2 objects.`);
} finally {
  await prisma.$disconnect();
}