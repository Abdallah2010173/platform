'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserRole } from '@platform/shared';
import ProtectedRoute, { useAuth } from '@/components/auth/protected-route';
import { roleToRoute } from '@/lib/auth';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, ready } = useAuth();

  useEffect(() => {
    if (!ready || !isAuthenticated || !user) return;
    if (!allowedRoles.includes(user.role)) {
      // Redirect to the user's own dashboard.
      router.replace(roleToRoute(user.role));
    }
  }, [ready, isAuthenticated, user, allowedRoles, pathname, router]);

  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export function useRoleAllowed(allowedRoles: UserRole[]): boolean {
  const { user, isAuthenticated, ready } = useAuth();
  if (!ready || !isAuthenticated || !user) return false;
  return allowedRoles.includes(user.role);
}
