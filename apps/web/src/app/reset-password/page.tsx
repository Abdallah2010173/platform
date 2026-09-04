'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi, formatApiError } from '@/lib/api/services';
import { BrandLogo } from '@/components/brand-logo';
import { PasswordInput } from '@/components/auth/password-input';

const resetSchema = z
  .object({
    password: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/, 'Password must contain at least 8 characters, an uppercase letter, a lowercase letter, a number, and a special character.'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetForm = z.infer<typeof resetSchema>;

function ResetPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const otp = searchParams.get('otp') ?? '';
  const token = searchParams.get('token') ?? '';

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ResetForm>({ resolver: zodResolver(resetSchema) });
  const password = useWatch({ control, name: 'password', defaultValue: '' });
  const requirements = [
    ['8+ characters', password.length >= 8],
    ['Uppercase letter', /[A-Z]/.test(password)],
    ['Lowercase letter', /[a-z]/.test(password)],
    ['Number', /\d/.test(password)],
    ['Special character', /[^A-Za-z\d]/.test(password)],
  ] as const;

  const onSubmit = async (data: ResetForm) => {
    if ((!email || !otp) && !token) {
      setError('Missing reset code. Please use the code from your email.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (email && otp) await authApi.resetPassword(email, otp, data.password);
      else await authApi.resetPassword(token, data.password);
      setDone(true);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <CardContent>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="bg-primary/10 flex h-14 w-14 items-center justify-center rounded-full">
            <KeyRound className="text-primary h-7 w-7" />
          </div>
          <p className="font-medium">Password reset successful</p>
          <p className="text-muted-foreground text-sm">
            You can now sign in with your new password.
          </p>
          <Button className="mt-2 w-full" onClick={() => router.replace('/login')}>
            Sign in
          </Button>
        </div>
      </CardContent>
    );
  }

  return (
    <CardContent>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <PasswordInput id="password" {...register('password')} />
          {errors.password && <p className="text-destructive text-sm">{errors.password.message}</p>}
          <ul className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
            {requirements.map(([label, valid]) => <li key={label} className={valid ? 'text-primary' : undefined}>{valid ? '✓' : '○'} {label}</li>)}
          </ul>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <PasswordInput id="confirmPassword" {...register('confirmPassword')} />
          {errors.confirmPassword && (
            <p className="text-destructive text-sm">{errors.confirmPassword.message}</p>
          )}
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Resetting...' : 'Reset password'}
        </Button>
        <p className="text-muted-foreground text-center text-sm">
          <Link href="/login" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </CardContent>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="bg-muted/40 flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-2 flex items-center gap-2">
            <BrandLogo size="md" link={false} />
          </Link>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Choose a new password for your account</CardDescription>
        </CardHeader>
        <Suspense fallback={<CardContent>Loading...</CardContent>}>
          <ResetPasswordForm />
        </Suspense>
      </Card>
    </div>
  );
}
