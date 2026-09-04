'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi, formatApiError } from '@/lib/api/services';
import { PasswordInput } from '@/components/auth/password-input';

const registerSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/, 'Password must contain at least 8 characters, an uppercase letter, a lowercase letter, a number, and a special character.'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

function RegisterContent() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    getValues,
    control,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: searchParams.get('email') ?? '' },
  });
  const password = useWatch({ control, name: 'password', defaultValue: '' });
  const requirements = [
    ['8+ characters', password.length >= 8],
    ['Uppercase letter', /[A-Z]/.test(password)],
    ['Lowercase letter', /[a-z]/.test(password)],
    ['Number', /\d/.test(password)],
    ['Special character', /[^A-Za-z\d]/.test(password)],
  ] as const;

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setError(null);
    try {
      await authApi.register({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      });
      setSuccess('Please verify your email address to continue. Check your inbox for the four-digit code.');
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    setResending(true);
    setError(null);
    try {
      await authApi.resendVerification(getValues('email'));
    } catch {
      setError('Unable to resend verification email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <Link href="/" className="mx-auto mb-2 flex items-center gap-2">
          <GraduationCap className="text-primary h-8 w-8" />
        </Link>
        <CardTitle>Create an account</CardTitle>
          <CardDescription>
            {searchParams.get('oauth_error') === 'google_signup_disabled'
              ? 'Google signup is not available. Create your account with email and password first.'
              : searchParams.get('oauth_error') === 'google_account_not_registered'
                ? 'No account exists with this Google email. Create one to continue.'
                : searchParams.get('oauth_error') === 'google_account_already_exists'
                  ? 'An account already exists with this email. Please sign in instead.'
                  : 'Register to start learning on the platform'}
          </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" {...register('firstName')} />
              {errors.firstName && (
                <p className="text-destructive text-sm">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" {...register('lastName')} />
              {errors.lastName && (
                <p className="text-destructive text-sm">{errors.lastName.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput id="password" {...register('password')} />
            {errors.password && (
              <p className="text-destructive text-sm">{errors.password.message}</p>
            )}
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
          {success && (
            <div className="space-y-2 text-sm">
              <p className="text-primary">{success}</p>
              <Button type="button" className="w-full" onClick={() => router.push(`/verify-email?email=${encodeURIComponent(getValues('email'))}`)}>
                Enter verification code
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={resendVerification} disabled={resending}>
                {resending ? 'Sending...' : 'Resend verification email'}
              </Button>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading || !!success}>
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
          <p className="text-muted-foreground text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <div className="bg-muted/40 flex min-h-screen items-center justify-center px-4 py-8">
      <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
        <RegisterContent />
      </Suspense>
    </div>
  );
}
