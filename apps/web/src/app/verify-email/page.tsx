'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi, formatApiError } from '@/lib/api/services';
import { BrandLogo } from '@/components/brand-logo';

function VerifyEmailForm() {
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email') ?? '';
  const [otp, setOtp] = useState('');

  useEffect(() => {
    if (!token) {
      setState('error');
      setState(email ? 'loading' : 'error');
      if (!email) setMessage('Missing verification email.');
      return;
    }
    let active = true;
    authApi
      .verifyEmail(token)
      .then(() => {
        if (active) setState('success');
      })
      .catch((e) => {
        if (active) {
          setState('error');
          setMessage(formatApiError(e));
        }
      });
    return () => {
      active = false;
    };
  }, [token]);

  const submitOtp = async () => {
    setState('loading');
    try {
      const response = await authApi.verifyEmail(email, otp) as { accessToken?: string; refreshToken?: string };
      if (response.accessToken) localStorage.setItem('accessToken', response.accessToken);
      if (response.refreshToken) localStorage.setItem('refreshToken', response.refreshToken);
      setState('success');
    } catch (e) {
      setState('error');
      setMessage(formatApiError(e));
    }
  };

  return (
    <CardContent>
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        {state === 'loading' && !token && email && (
          <>
            <div className="bg-primary/10 flex h-14 w-14 items-center justify-center rounded-full">
              <ShieldCheck className="text-primary h-7 w-7" />
            </div>
            <p className="font-medium">Enter the code from your email</p>
            <Input inputMode="numeric" maxLength={4} placeholder="4-digit code" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} />
            <Button className="mt-2 w-full" disabled={otp.length !== 4} onClick={submitOtp}>Verify email</Button>
          </>
        )}
        {state === 'loading' && token && (
          <>
            <div className="bg-primary/10 flex h-14 w-14 items-center justify-center rounded-full">
              <ShieldCheck className="text-primary h-7 w-7 animate-pulse" />
            </div>
            <p className="font-medium">Verifying your email...</p>
          </>
        )}
        {state === 'success' && (
          <>
            <div className="bg-primary/10 flex h-14 w-14 items-center justify-center rounded-full">
              <ShieldCheck className="text-primary h-7 w-7" />
            </div>
            <p className="font-medium">Email verified successfully!</p>
            <p className="text-muted-foreground text-sm">
              Your account is now active. You can sign in.
            </p>
            <Button className="mt-2 w-full" onClick={() => router.replace('/login')}>
              Go to sign in
            </Button>
          </>
        )}
        {state === 'error' && (
          <>
            <div className="bg-destructive/10 flex h-14 w-14 items-center justify-center rounded-full">
              <ShieldAlert className="text-destructive h-7 w-7" />
            </div>
            <p className="font-medium">Verification failed</p>
            <p className="text-muted-foreground text-sm">{message}</p>
            <Button
              variant="outline"
              className="mt-2 w-full"
              onClick={() => router.replace('/login')}
            >
              Back to sign in
            </Button>
          </>
        )}
      </div>
    </CardContent>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="bg-muted/40 flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-2 flex items-center gap-2">
            <BrandLogo size="md" link={false} />
          </Link>
          <CardTitle>Email verification</CardTitle>
          <CardDescription>Confirm your email address</CardDescription>
        </CardHeader>
        <Suspense fallback={<CardContent>Loading...</CardContent>}>
          <VerifyEmailForm />
        </Suspense>
      </Card>
    </div>
  );
}
