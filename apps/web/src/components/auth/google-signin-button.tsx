'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

// The Google OAuth entry point lives on the API.
const GOOGLE_REDIRECT_URL = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URL?.trim() ?? '';
const DEFAULT_API_URL = 'https://platformapi-production-c6d1.up.railway.app/api/v1';

export function resolveGoogleAuthUrl({
  googleRedirectUrl,
  apiUrl,
  redirect,
}: {
  googleRedirectUrl?: string;
  apiUrl?: string;
  redirect?: string | null;
}): string {
  const configuredUrl = googleRedirectUrl?.trim();
  const fallbackBase = apiUrl?.trim() || DEFAULT_API_URL;
  
  // بناء رابط الـ Backend المباشر لتفادي التوجيه الداخلي الخاطئ
  const fallbackUrl = `${fallbackBase.replace(/\/+$/, '')}/auth/google`;
  const baseUrl = configuredUrl || fallbackUrl;

  if (!baseUrl) {
    throw new Error('Google sign-in is not configured.');
  }

  // إنشاء رابط مطلق بدون الاعتماد على origin الفرونت إند
  const url = new URL(baseUrl);
  if (redirect && redirect.startsWith('/')) {
    url.searchParams.set('redirect', redirect);
  }

  return url.toString();
}

export function GoogleSignInButton({
  variant = 'outline',
  className,
}: {
  variant?: 'outline' | 'default' | 'secondary';
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const handleClick = () => {
    setError(null);
    try {
      setLoading(true);
      const redirect = searchParams.get('redirect');
      const url = resolveGoogleAuthUrl({
        googleRedirectUrl: GOOGLE_REDIRECT_URL,
        apiUrl: process.env.NEXT_PUBLIC_API_URL,
        redirect,
      });
      window.location.assign(url);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : 'Google sign-in is not available right now.');
    }
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={variant}
        className={`w-full ${className ?? ''}`}
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? 'Redirecting to Google…' : 'Continue with Google'}
      </Button>
      {!loading && (
        <p className="text-center text-xs text-muted-foreground">
          By continuing with Google you agree to our terms.
        </p>
      )}
      {error && <p className="text-destructive text-center text-sm">{error}</p>}
    </div>
  );
}