'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/store';
import { hydrate } from '@/lib/store/slices/auth.slice';
import { getStoredTokens, getStoredUser } from '@/lib/auth';

export function useAuthHydration() {
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    dispatch(hydrate());
    setReady(true);
  }, [dispatch]);

  return { isAuthenticated, ready };
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, ready } = useAuthHydration();

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [ready, isAuthenticated, pathname, router]);

  if (!ready) {
    return (
      <div className="text-muted-foreground flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

export function useAuth() {
  const { ready, isAuthenticated } = useAuthHydration();
  const user = useSelector((state: RootState) => state.auth.user);
  return { user, isAuthenticated, ready };
}

// Convenience helper for components that want session check without full guard.
export function requireSession(): {
  accessToken: string;
  user: ReturnType<typeof getStoredUser>;
} | null {
  const { accessToken } = getStoredTokens();
  const user = getStoredUser();
  if (!accessToken || !user) return null;
  return { accessToken, user };
}
