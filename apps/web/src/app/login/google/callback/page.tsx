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
    const authError = searchParams.get('error');

    if (authError) {
      setError('تم إلغاء عملية تسجيل الدخول من جوجل.');
      return;
    }

    if (!code) return;

    const authenticateGoogle = async () => {
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL?.trim() ||
          'https://platformapi-production-c6d1.up.railway.app/api/v1';

        // إرسال طلب POST إلى مسار exchange للتحقق من الكود
        const res = await fetch(
          `${baseUrl.replace(/\/+$/, '')}/auth/google/exchange`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
          }
        );

        const responseData = await res.json();
        const data = responseData?.data ?? responseData;

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
        console.error('Google Auth Error:', err);
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