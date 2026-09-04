'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi, formatApiError } from '@/lib/api/services';
import { BrandLogo } from '@/components/brand-logo';

const forgotSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({ resolver: zodResolver(forgotSchema) });

  const onSubmit = async (data: ForgotForm) => {
    setLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword(data.email);
      setEmail(data.email);
      setSent(true);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-muted/40 flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-2 flex items-center gap-2">
            <BrandLogo size="md" link={false} />
          </Link>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>Enter your email to receive a password reset link</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="bg-primary/10 flex h-14 w-14 items-center justify-center rounded-full">
                <MailCheck className="text-primary h-7 w-7" />
              </div>
              <p className="font-medium">Check your email</p>
              <p className="text-muted-foreground text-sm">If an account exists for that email, a four-digit reset code will arrive shortly.</p>
              <Label htmlFor="otp" className="sr-only">Reset code</Label>
              <Input id="otp" inputMode="numeric" maxLength={4} placeholder="4-digit code" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} />
              <Button className="w-full" disabled={otp.length !== 4} onClick={async () => {
                try {
                  await authApi.verifyResetOtp(email, otp);
                  router.push(`/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`);
                } catch (e) {
                  setError(formatApiError(e));
                }
              }}>Continue</Button>
              <Button variant="outline" className="mt-2" onClick={() => { setOtp(''); setSent(false); }}>Send again</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} />
                {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send reset link'}
              </Button>
              <p className="text-muted-foreground text-center text-sm">
                Remembered your password?{' '}
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
