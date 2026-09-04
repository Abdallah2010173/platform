'use client';

import { generateUploadButton, generateUploadDropzone } from '@uploadthing/react';
import type { OurFileRouter } from '@/app/api/uploadthing/core';

const UploadButton = generateUploadButton<OurFileRouter>();
const UploadDropzone = generateUploadDropzone<OurFileRouter>();

interface FileUploadProps {
  onUploaded?: (url: string) => void;
}

/**
 * Reusable UploadThing controls for platform images and PDF materials.
 * The generated components stay type-safe because they use OurFileRouter.
 */
export function FileUpload({ onUploaded }: FileUploadProps) {
  const handleUploadComplete = (files: Array<{ url: string }>) => {
    const url = files[0]?.url;
    if (!url) return;

    console.log('[UploadThing] Upload complete:', url);
    onUploaded?.(url);
  };

  const handleUploadError = (error: Error) => {
    console.error('[UploadThing] Upload failed:', error);
    window.alert(`Upload failed: ${error.message}`);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="space-y-3 rounded-lg border p-4">
        <div>
          <h2 className="font-semibold">Images and logos</h2>
          <p className="text-muted-foreground text-sm">PNG, JPG, WEBP, or GIF up to 4MB.</p>
        </div>
        <UploadDropzone
          endpoint="imageUploader"
          onClientUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          config={{ mode: 'auto' }}
        />
        <UploadButton
          endpoint="imageUploader"
          onClientUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
        />
      </section>

      <section className="space-y-3 rounded-lg border p-4">
        <div>
          <h2 className="font-semibold">PDF materials</h2>
          <p className="text-muted-foreground text-sm">Lesson materials and homework up to 16MB.</p>
        </div>
        <UploadDropzone
          endpoint="pdfUploader"
          onClientUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          config={{ mode: 'auto' }}
        />
        <UploadButton
          endpoint="pdfUploader"
          onClientUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
        />
      </section>
    </div>
  );
}