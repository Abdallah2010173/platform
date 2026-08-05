'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { GraduationCap, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi, formatApiError } from '@/lib/api/services';

function VerifyEmailForm() {
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setState('error');
      setMessage('Missing verification token.');
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

  return (
    <CardContent>
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        {state === 'loading' && (
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
            <GraduationCap className="text-primary h-8 w-8" />
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
