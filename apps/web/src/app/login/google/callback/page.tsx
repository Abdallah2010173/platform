'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GoogleCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/auth/google/callback${window.location.search}`);
  }, [router]);

  return <div className="flex min-h-screen items-center justify-center">Completing Google sign-in...</div>;
}