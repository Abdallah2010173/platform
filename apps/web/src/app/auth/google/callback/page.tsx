'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api/services';
import { AppDispatch } from '@/lib/store';
import { setCredentials } from '@/lib/store/slices/auth.slice';
import { AuthUser, roleToRoute } from '@/lib/auth';

function GoogleCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const [error, setError] = useState<string | null>(null);
  const handledRef = useRef(false);

  const handle = useCallback(async () => {
    if (handledRef.current) return;
    handledRef.current = true;

    const code = searchParams.get('code');
    const oauthError = searchParams.get('oauth_error');

    if (oauthError) {
      setError('Google sign-in failed. Please try again.');
      return;
    }

    if (!code) {
      setError('Missing Google authorization code.');
      return;
    }

    try {
      const payload = (await authApi.googleExchange(code)) as {
        accessToken: string;
        refreshToken: string;
        user: AuthUser;
      };

      if (!payload.accessToken || !payload.refreshToken || !payload.user) {
        setError('Invalid Google sign-in response.');
        return;
      }

      dispatch(
        setCredentials({
          user: payload.user,
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
        }),
      );

      const requested = searchParams.get('redirect');
      const target = requested && requested.startsWith('/') ? requested : roleToRoute(payload.user.role);
      router.replace(target);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google sign-in failed. Please try again.');
    }
  }, [searchParams, dispatch, router]);

  useEffect(() => {
    void handle();
  }, [handle]);

  if (error) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Sign-in failed</h1>
          <p className="text-muted-foreground mt-2 text-sm">{error}</p>
          <button
            onClick={() => router.replace('/login')}
            className="text-primary mt-6 text-sm underline"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <h1 className="text-xl font-semibold">Completing Google sign-in…</h1>
        <p className="text-muted-foreground text-sm">Please wait</p>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground p-8">Loading...</div>}>
      <GoogleCallbackInner />
    </Suspense>
  );
}
