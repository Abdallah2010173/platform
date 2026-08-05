'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { LogOut } from 'lucide-react';
import { clearCredentials } from '@/lib/store/slices/auth.slice';
import { AppDispatch } from '@/lib/store';
import { Button } from '@/components/ui/button';

export default function LogoutPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(clearCredentials());
  }, [dispatch]);

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <div className="bg-primary/10 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
          <LogOut className="text-primary h-7 w-7" />
        </div>
        <h1 className="text-2xl font-semibold">You have been logged out</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Thank you for using the platform. See you soon!
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={() => router.replace('/login')}>Sign back in</Button>
          <Button variant="outline" onClick={() => router.replace('/')}>
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
