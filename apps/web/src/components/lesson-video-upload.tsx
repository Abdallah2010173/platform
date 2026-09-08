'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { Upload } from 'lucide-react';
import { API_URL } from '@/lib/api/client';

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

interface LessonVideoUploadProps {
  lessonId: string;
  label: string;
  onUploaded: (video: { id: string; status?: string; jobId?: string }) => void;
}

export function LessonVideoUpload({ lessonId, label, onUploaded }: LessonVideoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setIsUploading(true);
    setProgress(0);
    setUploadedBytes(0);
    setTotalBytes(file.size);
    setStatusMessage('');
    setErrorMessage('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('accessToken');
      const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open('POST', `${API_URL}/media/lessons/${lessonId}/videos`);
        if (token) request.setRequestHeader('Authorization', `Bearer ${token}`);
        request.upload.addEventListener('progress', (progressEvent) => {
          if (!progressEvent.lengthComputable) return;
          setUploadedBytes(progressEvent.loaded);
          setTotalBytes(progressEvent.total);
          setProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
        });
        request.addEventListener('error', () => reject(new Error('Network error while uploading video')));
        request.addEventListener('abort', () => reject(new Error('Video upload was cancelled')));
        request.addEventListener('load', () => {
          let response: Record<string, unknown> = {};
          try { response = JSON.parse(request.responseText) as Record<string, unknown>; } catch { /* empty response */ }
          if (request.status >= 200 && request.status < 300) resolve((response.data ?? response) as Record<string, unknown>);
          else reject(new Error(String(response.message ?? 'Could not queue video')));
        });
        request.send(formData);
      });
      setProgress(100);
      setStatusMessage('Uploaded 100% - Processing video...');
      onUploaded(result as { id: string; status?: string; jobId?: string });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Video upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime" onChange={handleChange} className="hidden" />
      <button type="button" className="border-primary bg-primary text-primary-foreground flex h-10 w-full items-center justify-center gap-2 rounded-md border text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50" onClick={() => inputRef.current?.click()} disabled={isUploading}>
        <Upload className="h-4 w-4" />
        {isUploading ? 'Uploading...' : label}
      </button>
      {isUploading && (
        <div className="space-y-1" aria-live="polite">
          <div className="bg-muted h-2 overflow-hidden rounded-full">
            <div className="bg-primary h-full transition-[width]" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-muted-foreground text-xs">
            Uploading {formatBytes(uploadedBytes)} / {formatBytes(totalBytes)} ({progress}%)
          </p>
        </div>
      )}
      {statusMessage && <p className="text-muted-foreground text-xs" aria-live="polite">{statusMessage}</p>}
      {errorMessage && <p className="text-destructive text-xs" role="alert">{errorMessage}</p>}
    </>
  );
}