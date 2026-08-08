import type { Metadata } from 'next';
import { UserRole } from '@platform/shared';
import RoleGuard from '@/components/auth/role-guard';
import DashboardLayout from '@/components/dashboard/dashboard-layout';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={[UserRole.ADMIN]}>
      <DashboardLayout
        title="Admin Dashboard"
        description="Manage the platform, users, courses, and analytics."
      >
        {children}
      </DashboardLayout>
    </RoleGuard>
  );
}
