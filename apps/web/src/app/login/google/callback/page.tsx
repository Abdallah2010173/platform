'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@/lib/store/slices/auth.slice';
import { AuthUser, roleToRoute } from '@/lib/auth';

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) return;

    const authenticateGoogle = async () => {
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL?.trim() ||
          'https://platformapi-production-c6d1.up.railway.app/api/v1';

        const redirectUri = 'https://platform-web-five.vercel.app/login/google/callback';

        // إرسال الكود مع الـ redirect_uri إلى سيرفر NestJS
        const res = await fetch(
          `${baseUrl.replace(/\/+$/, '')}/auth/google/callback?code=${encodeURIComponent(
            code
          )}&redirect_uri=${encodeURIComponent(redirectUri)}`
        );

        const data = await res.json();

        if (!res.ok || !data.accessToken) {
          throw new Error(data.message || 'Google Authentication failed');
        }

        // حفظ بيانات الجلسة في Redux
        dispatch(
          setCredentials({
            user: data.user as AuthUser,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          })
        );

        // التوجيه للوحة التحكم حسب نوع الحساب
        const targetRoute = roleToRoute((data.user as AuthUser).role);
        router.replace(targetRoute);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Login failed');
      }
    };

    authenticateGoogle();
  }, [searchParams, dispatch, router]);

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-destructive font-medium">{error}</p>
        <button
          onClick={() => router.push('/login')}
          className="text-sm underline text-primary"
        >
          العودة لصفحة الدخول
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-sm font-medium animate-pulse">جاري تسجيل الدخول والدخول للمنصة...</p>
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