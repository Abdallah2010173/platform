import type { Metadata } from 'next';
import { UserRole } from '@platform/shared';
import RoleGuard from '@/components/auth/role-guard';
import DashboardLayout from '@/components/dashboard/dashboard-layout';

export const metadata: Metadata = {
  title: 'Student Dashboard',
};

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={[UserRole.STUDENT]}>
      <DashboardLayout title="Student Dashboard" description="Continue your learning journey.">
        {children}
      </DashboardLayout>
    </RoleGuard>
  );
}
