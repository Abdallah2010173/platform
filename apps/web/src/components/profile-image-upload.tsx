'use client';

import { generateUploadButton } from '@uploadthing/react';
import type { OurFileRouter } from '@/app/api/uploadthing/core';

const UploadButton = generateUploadButton<OurFileRouter>();

interface ProfileImageUploadProps {
  onUploaded: (url: string) => void;
  disabled?: boolean;
}

export function ProfileImageUpload({ onUploaded, disabled = false }: ProfileImageUploadProps) {
  return (
    <UploadButton
      endpoint="imageUploader"
      disabled={disabled}
      onClientUploadComplete={(files) => {
        const url = files[0]?.url;
        if (url) onUploaded(url);
      }}
      onUploadError={(error) => window.alert(`Image upload failed: ${error.message}`)}
      appearance={{ button: 'ut-ready:bg-primary ut-uploading:cursor-not-allowed' }}
      content={{ button: 'Upload profile photo' }}
    />
  );
}
