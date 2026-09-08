'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { Upload } from 'lucide-react';
import { API_URL } from '@/lib/api/client';

interface LessonVideoUploadProps {
  lessonId: string;
  label: string;
  onUploaded: (video: { id: string; status?: string; jobId?: string }) => void;
}

export function LessonVideoUpload({ lessonId, label, onUploaded }: LessonVideoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/media/lessons/${lessonId}/videos`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.message || 'Could not queue video');
      onUploaded(body.data ?? body);
    } catch (error) {
      window.alert(`Video upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    </>
  );
}