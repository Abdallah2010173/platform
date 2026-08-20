'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function CallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL?.trim() ||
        'https://platformapi-production-c6d1.up.railway.app/api/v1';
      const cleanUrl = baseUrl.replace(/\/+$/, '');
      
      // تحويل الكود المباشر لسيرفر NestJS على Railway
      window.location.href = `${cleanUrl}/auth/google/callback?code=${code}`;
    }
  }, [searchParams]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-sm font-medium">جاري إتمام تسجيل الدخول عبر Google...</p>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <CallbackContent />
    </Suspense>
  );
}