'use client';

import { R2FileUpload } from './r2-file-upload';

interface ProfileImageUploadProps {
  onUploaded: (url: string) => void;
  disabled?: boolean;
}

export function ProfileImageUpload({ onUploaded, disabled = false }: ProfileImageUploadProps) {
  return (
    <R2FileUpload
      accept="image/png,image/jpeg,image/webp,image/gif"
      label="Upload profile photo"
      disabled={disabled}
      onUploaded={(file) => onUploaded(file.publicUrl ?? file.fileKey)}
    />
  );
}
