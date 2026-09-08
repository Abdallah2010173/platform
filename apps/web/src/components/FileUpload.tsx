'use client';

import { R2FileUpload } from './r2-file-upload';

interface FileUploadProps {
  onUploaded?: (url: string) => void;
}

export function FileUpload({ onUploaded }: FileUploadProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="space-y-3 rounded-lg border p-4">
        <div>
          <h2 className="font-semibold">Images and logos</h2>
          <p className="text-muted-foreground text-sm">PNG, JPG, WEBP, or GIF up to 4MB.</p>
        </div>
        <R2FileUpload accept="image/png,image/jpeg,image/webp,image/gif" label="Choose image" onUploaded={(file) => onUploaded?.(file.publicUrl ?? file.fileKey)} />
      </section>
      <section className="space-y-3 rounded-lg border p-4">
        <div>
          <h2 className="font-semibold">PDF materials</h2>
          <p className="text-muted-foreground text-sm">Lesson materials and homework up to 16MB.</p>
        </div>
        <R2FileUpload accept="application/pdf" label="Choose PDF" onUploaded={(file) => onUploaded?.(file.publicUrl ?? file.fileKey)} />
      </section>
    </div>
  );
}
