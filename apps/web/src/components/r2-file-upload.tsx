'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { Upload } from 'lucide-react';
import { API_URL } from '@/lib/api/client';

interface UploadedFile {
  fileKey: string;
  fileName: string;
  contentType: string;
  publicUrl?: string;
}

interface R2FileUploadProps {
  accept?: string;
  label: string;
  onUploaded: (file: UploadedFile) => void;
  disabled?: boolean;
}

export function R2FileUpload({ accept, label, onUploaded, disabled = false }: R2FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsUploading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/files/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ fileName: file.name, contentType: file.type || 'application/octet-stream' }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.message || 'Could not create upload URL');

      const upload = body.data ?? body;
      const uploadResponse = await fetch(upload.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });
      if (!uploadResponse.ok) throw new Error('Could not upload file to R2');

      onUploaded({
        fileKey: upload.fileKey,
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        publicUrl: upload.publicUrl,
      });
    } catch (error) {
      window.alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
      <button
        type="button"
        className="border-primary bg-primary text-primary-foreground flex h-10 w-full items-center justify-center gap-2 rounded-md border text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || isUploading}
      >
        <Upload className="h-4 w-4" />
        {isUploading ? 'Uploading...' : label}
      </button>
    </>
  );
}
