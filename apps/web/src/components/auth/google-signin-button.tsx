'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

// The Google OAuth entry point lives on the API. Derive it from the public API
// URL rather than hardcoding a deployment domain so the same build works across
// local, Vercel and Railway. NEXT_PUBLIC_GOOGLE_REDIRECT_URL remains available
// as an explicit override when the API is served from a separate host/path.
const GOOGLE_REDIRECT_URL = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URL?.trim() ?? '';

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
  const fallbackBase = apiUrl?.trim();
  const fallbackUrl = fallbackBase
    ? `${fallbackBase.replace(/\/+$/, '')}/auth/google`
    : '';
  const baseUrl = configuredUrl || fallbackUrl || '/api/v1/auth/google';

  if (!baseUrl) {
    throw new Error('Google sign-in is not configured.');
  }

  const url = new URL(baseUrl, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
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

