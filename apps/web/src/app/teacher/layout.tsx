import type { Metadata } from 'next';
import { UserRole } from '@platform/shared';
import RoleGuard from '@/components/auth/role-guard';
import DashboardLayout from '@/components/dashboard/dashboard-layout';

export const metadata: Metadata = {
  title: 'Teacher Dashboard',
};

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={[UserRole.TEACHER]}>
      <DashboardLayout
        title="Teacher Dashboard"
        description="Manage your classes, students, and content."
      >
        {children}
      </DashboardLayout>
    </RoleGuard>
  );
}
