'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loginRequest } from '@/lib/api/client';
import { authApi } from '@/lib/api/services';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/store';
import { setCredentials } from '@/lib/store/slices/auth.slice';
import { AuthUser, roleToRoute } from '@/lib/auth';
import { GoogleSignInButton } from '@/components/auth/google-signin-button';
import { API_URL } from '@/lib/api/client';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginFormInner() {
  const [error, setError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const oauthError = searchParams.get('oauth_error');
const oauthMessage = oauthError === 'google_signup_disabled'
    ? 'Google signup is not available. Please create your account with email and password first.'
    : oauthError === 'google_account_not_registered'
      ? 'No account exists with this Google email. Please create an account first.'
      : oauthError === 'google_account_already_exists'
        ? 'An account already exists with this email. Please sign in instead.'
        : oauthError === 'google_account_link_required'
          ? 'This email already has an account. Sign in with your password before using Google.'
          : oauthError
            ? 'Google sign-in failed. Please try again.'
            : null;

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError(null);
    try {
      const payload = await loginRequest(data.email, data.password);
      const user = payload.user as AuthUser;
      const accessToken = payload.accessToken;
      const refreshToken = payload.refreshToken;

      if (!accessToken || !refreshToken || !user) {
        throw new Error('Invalid login response');
      }

      dispatch(setCredentials({ user, accessToken, refreshToken }));

      const requested = searchParams.get('redirect');
      const target = requested && requested.startsWith('/') ? requested : roleToRoute(user.role);
      router.replace(target);
    } catch (e) {
      const payload = (e as { response?: { data?: { code?: string; message?: string } } })?.response?.data;
      const code = payload?.code ?? '';

      if (code === 'EMAIL_NOT_VERIFIED') {
        router.replace(`/verify-email?email=${encodeURIComponent(data.email)}`);
        return;
      }

      if (code === 'LOGIN_WITH_GOOGLE_REQUIRED') {
        setError("This account was created via Google. Please click 'Sign in with Google' below.");
        return;
      }

      setError(payload?.message || (e instanceof Error ? e.message : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    setResending(true);
    setResendMessage(null);
    try {
      const response = await authApi.resendVerification(getValues('email')) as { message?: string };
      setResendMessage(response.message ?? 'A new verification email has been sent.');
    } catch {
      setResendMessage('Unable to resend verification email. Please try again later.');
    } finally {
      setResending(false);
    }
  };

  const needsVerification = error === 'Please verify your email address to continue.';

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <Link href="/" className="mx-auto mb-2 flex items-center gap-2">
          <GraduationCap className="text-primary h-8 w-8" />
        </Link>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Enter your credentials to access the platform</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register('password')} />
            {errors.password && (
              <p className="text-destructive text-sm">{errors.password.message}</p>
            )}
          </div>
          {(error || oauthMessage) && (
            <div className="space-y-2">
              <p className="text-destructive text-sm">{error || oauthMessage}</p>
              {error === "This account was created via Google. Please click 'Sign in with Google' below." && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    window.location.href = `${API_URL}/auth/google?intent=signin`;
                  }}
                >
                  Sign in with Google
                </Button>
              )}
            </div>
          )}
          {searchParams.get('registered') === '1' && <p className="text-primary text-sm">Please verify your email address to continue.</p>}
          {needsVerification && (
            <Button type="button" variant="outline" className="w-full" onClick={resendVerification} disabled={resending}>
              {resending ? 'Sending...' : 'Resend verification email'}
            </Button>
          )}
          {resendMessage && <p className="text-primary text-sm">{resendMessage}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card text-muted-foreground px-2">or continue with</span>
            </div>
          </div>
          <GoogleSignInButton />
          <div className="flex items-center justify-between text-sm">
            <Link href="/forgot-password" className="text-muted-foreground hover:text-foreground hover:underline">
              Forgot password?
            </Link>
            <Link href="/register" className="text-primary hover:underline">
              Create account
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="bg-muted/40 flex min-h-screen items-center justify-center px-4">
      <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
        <LoginFormInner />
      </Suspense>
    </div>
  );
}
