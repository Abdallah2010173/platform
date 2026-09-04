import { createUploadthing, type FileRouter } from 'uploadthing/next';

const upload = createUploadthing();

/**
 * UploadThing routes used by the platform.
 * The token is read server-side from UPLOADTHING_TOKEN.
 */
export const ourFileRouter: FileRouter = {
  fileUploader: upload({
    blob: { maxFileSize: '64MB', maxFileCount: 1 },
  }).onUploadComplete(({ file }) => {
    console.log(`[UploadThing] File uploaded: ${file.url}`);
    return { url: file.url, name: file.name, key: file.key };
  }),

  imageUploader: upload({
    image: { maxFileSize: '4MB', maxFileCount: 1 },
  }).onUploadComplete(({ file }) => {
    console.log(`[UploadThing] Image uploaded: ${file.url}`);
    return { url: file.url, name: file.name, key: file.key };
  }),

  pdfUploader: upload({
    pdf: { maxFileSize: '16MB', maxFileCount: 1 },
  }).onUploadComplete(({ file }) => {
    console.log(`[UploadThing] PDF uploaded: ${file.url}`);
    return { url: file.url, name: file.name, key: file.key };
  }),

  videoUploader: upload({
    video: { maxFileSize: '512MB', maxFileCount: 1 },
  }).onUploadComplete(({ file }) => {
    console.log(`[UploadThing] Video uploaded: ${file.url}`);
    return { url: file.url, name: file.name, key: file.key };
  }),
};

export type OurFileRouter = typeof ourFileRouter;