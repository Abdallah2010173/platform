'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { API_URL } from '@/lib/api/client';

interface ProtectedHlsVideoProps {
  videoId: string;
  fallbackUrl?: string;
  title: string;
}

export function ProtectedHlsVideo({ videoId, fallbackUrl, title }: ProtectedHlsVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [message, setMessage] = useState('Loading video...');

  useEffect(() => {
    let hls: Hls | undefined;
    let cancelled = false;
    const token = localStorage.getItem('accessToken');

    const load = async () => {
      try {
        const response = await fetch(`${API_URL}/media/videos/${videoId}/manifest-url`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body?.message || 'Video is still processing');
        if (cancelled || !videoRef.current) return;
        const manifestUrl = body.data?.url ?? body.url ?? fallbackUrl;
        if (!manifestUrl) throw new Error('Video manifest is unavailable');
        const element = videoRef.current;
        if (element.canPlayType('application/vnd.apple.mpegurl')) {
          element.src = manifestUrl;
          setMessage('');
          return;
        }
        if (!Hls.isSupported()) throw new Error('This browser does not support HLS playback');
        hls = new Hls({
          enableWorker: true,
          xhrSetup: (request) => {
            if (token) request.setRequestHeader('Authorization', `Bearer ${token}`);
          },
        });
        hls.loadSource(manifestUrl);
        hls.attachMedia(element);
        hls.on(Hls.Events.MANIFEST_PARSED, () => setMessage(''));
        hls.on(Hls.Events.ERROR, async (_event, data) => {
          if (!data.fatal || cancelled) return;
          try {
            const sourceResponse = await fetch(`${API_URL}/media/videos/${videoId}/source-url`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const sourceBody = await sourceResponse.json();
            const sourceUrl = sourceBody.data?.url ?? sourceBody.url;
            if (!sourceResponse.ok || !sourceUrl || !videoRef.current) throw new Error('Original video is unavailable');
            hls?.destroy();
            videoRef.current.src = sourceUrl;
            setMessage('');
          } catch {
            setMessage('Video playback failed. Please try again.');
          }
        });
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : 'Video unavailable');
      }
    };
    void load();
    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, [fallbackUrl, videoId]);

  return (
    <div className="space-y-2">
      <video ref={videoRef} title={title} controls playsInline className="aspect-video w-full rounded-md bg-black" />
      {message && <p className="text-muted-foreground text-sm">{message}</p>}
    </div>
  );
}