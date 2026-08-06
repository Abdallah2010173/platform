'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import { authApi, formatApiError } from '@/lib/api/services';
import { AppDispatch } from '@/lib/store';
import { setCredentials } from '@/lib/store/slices/auth.slice';
import { AuthUser, roleToRoute } from '@/lib/auth';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

export function GoogleSignInButton({
  variant = 'outline',
  className,
}: {
  variant?: 'outline' | 'default' | 'secondary';
  className?: string;
}) {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const initializedRef = useRef(false);

  const handleGoogleCredential = useCallback(
    async (response: { credential?: string }) => {
      if (!response.credential) {
        setError('Google sign-in failed: no credential returned');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const payload = (await authApi.googleLogin(response.credential)) as {
          accessToken: string;
          refreshToken: string;
          user: AuthUser;
        };
        if (!payload.accessToken || !payload.refreshToken || !payload.user) {
          throw new Error('Invalid Google sign-in response');
        }
        dispatch(
          setCredentials({
            user: payload.user,
            accessToken: payload.accessToken,
            refreshToken: payload.refreshToken,
          }),
        );
        router.replace(roleToRoute(payload.user.role));
      } catch (e) {
        setError(formatApiError(e));
        setLoading(false);
      }
    },
    [dispatch, router],
  );

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !buttonRef.current) return;

    const render = () => {
      if (!window.google?.accounts?.id) return;
      if (!initializedRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredential,
          auto_select: false,
        });
        initializedRef.current = true;
      }
      if (buttonRef.current) {
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'continue_with',
          shape: 'rectangular',
        });
      }
    };

    if (window.google?.accounts?.id) {
      render();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = render;
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [handleGoogleCredential]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <Button type="button" variant={variant} className={className} disabled>
        Google sign-in is not configured
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <div ref={buttonRef} className="w-full" data-testid="google-signin" />
      {!loading && (
        <p className="text-center text-xs text-muted-foreground">
          By continuing with Google you agree to our terms.
        </p>
      )}
      {loading && <p className="text-center text-sm text-muted-foreground">Signing in...</p>}
      {error && <p className="text-destructive text-center text-sm">{error}</p>}
    </div>
  );
}

