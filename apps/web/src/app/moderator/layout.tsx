import type { Metadata } from 'next';
import { UserRole } from '@platform/shared';
import RoleGuard from '@/components/auth/role-guard';
import DashboardLayout from '@/components/dashboard/dashboard-layout';

export const metadata: Metadata = {
  title: 'Moderator Dashboard',
};

export default function ModeratorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={[UserRole.MODERATOR]}>
      <DashboardLayout
        title="Moderator Dashboard"
        description="Review and moderate platform content."
      >
        {children}
      </DashboardLayout>
    </RoleGuard>
  );
}
