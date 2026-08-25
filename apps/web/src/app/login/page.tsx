'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { loginRequest } from '@/lib/api/client';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/store';
import { setCredentials } from '@/lib/store/slices/auth.slice';
import { AuthUser, roleToRoute } from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginFormInner() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

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

      // Persist session + update Redux auth state.
      dispatch(setCredentials({ user, accessToken, refreshToken }));

      // Respect a requested redirect if it is safe and belongs to the user's role,
      // otherwise fall back to the role-based dashboard.
      const requested = searchParams.get('redirect');
      const target = requested && requested.startsWith('/') ? requested : roleToRoute(user.role);
      router.replace(target);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-0 shadow-xl">
      <CardContent className="p-8">
        <Link href="/" className="mb-10 flex justify-center" aria-label="Global Math home">
          <Image src="/global-math-logo.svg" alt="Global Math" width={330} height={110} priority className="h-auto w-full max-w-82.5" />
        </Link>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input id="email" type="email" placeholder="Email" aria-label="Email" {...register('email')} />
            {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
          </div>
          <div>
            <Input id="password" type="password" placeholder="Password" aria-label="Password" {...register('password')} />
            {errors.password && (
              <p className="text-destructive text-sm">{errors.password.message}</p>
            )}
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Loading...' : 'Login'}
          </Button>
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
