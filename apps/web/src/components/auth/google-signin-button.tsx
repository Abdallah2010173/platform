'use client';

import { Button } from '@/components/ui/button';

export function GoogleSignInButton() {
  const handleGoogleLogin = () => {
    const rawUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, '') || 'https://platformapi-production-c6d1.up.railway.app/api/v1';
    const baseUrl = rawUrl.endsWith('/api/v1') ? rawUrl : `${rawUrl}/api/v1`;
    
    // التحويل المباشر للباك إند للبدء بـ OAuth flow الخاص بـ NestJS
    window.location.href = `${baseUrl}/auth/google`;
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full flex items-center justify-center gap-2"
      onClick={handleGoogleLogin}
    >
      Sign in with Google
    </Button>
  );
}