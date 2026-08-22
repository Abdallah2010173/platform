import {
  LayoutDashboard,
  BookOpen,
  Video,
  ClipboardList,
  GraduationCap,
  Award,
  Calendar,
  MessageSquare,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  FileText,
  FolderOpen,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import { UserRole } from '@platform/shared';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const ROLE_NAV: Record<string, NavSection[]> = {
  [UserRole.STUDENT]: [
    {
      label: 'Menu',
      items: [
        { label: 'Dashboard', href: '/student', icon: LayoutDashboard },
        { label: 'My Courses', href: '/student/courses', icon: BookOpen },
        { label: 'Live Classes', href: '/student/live-classes', icon: Video },
        { label: 'Assignments', href: '/student/assignments', icon: ClipboardList },
        { label: 'Exams', href: '/student/exams', icon: GraduationCap },
        { label: 'Grades', href: '/student/grades', icon: Award },
        { label: 'Schedule', href: '/student/schedule', icon: Calendar },
        { label: 'Messages', href: '/student/messages', icon: MessageSquare },
        { label: 'Certificates', href: '/student/certificates', icon: FileText },
      ],
    },
    {
      label: 'General',
      items: [
        { label: 'Profile', href: '/student/profile', icon: Users },
        { label: 'Settings', href: '/student/settings', icon: Settings },
        { label: 'Help', href: '/student/help', icon: HelpCircle },
        { label: 'Logout', href: '/logout', icon: LogOut },
      ],
    },
  ],
  [UserRole.TEACHER]: [
    {
      label: 'Menu',
      items: [
        { label: 'Dashboard', href: '/teacher', icon: LayoutDashboard },
        { label: 'Courses', href: '/teacher/courses', icon: BookOpen },
        { label: 'Students', href: '/teacher/students', icon: Users },
        { label: 'Messages', href: '/teacher/messages', icon: MessageSquare },
        { label: 'Assignments', href: '/teacher/assignments', icon: ClipboardList },
        { label: 'Live Classes', href: '/teacher/live-classes', icon: Video },
        { label: 'Exams', href: '/teacher/exams', icon: GraduationCap },
        { label: 'Analytics', href: '/teacher/analytics', icon: BarChart3 },
        { label: 'Availability', href: '/teacher/availability', icon: Clock },
      ],
    },
    {
      label: 'General',
      items: [
        { label: 'Profile', href: '/teacher/profile', icon: Users },
        { label: 'Settings', href: '/teacher/settings', icon: Settings },
        { label: 'Help', href: '/teacher/help', icon: HelpCircle },
        { label: 'Logout', href: '/logout', icon: LogOut },
      ],
    },
  ],
  [UserRole.ADMIN]: [
    {
      label: 'Menu',
      items: [
        { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { label: 'Users', href: '/admin/users', icon: Users },
        { label: 'Courses', href: '/admin/courses', icon: BookOpen },
        { label: 'Categories', href: '/admin/categories', icon: FolderOpen },
        { label: 'Meetings', href: '/admin/meetings', icon: Video },
        { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      ],
    },
    {
      label: 'General',
      items: [
        { label: 'Settings', href: '/admin/settings', icon: Settings },
        { label: 'Help', href: '/admin/help', icon: HelpCircle },
        { label: 'Logout', href: '/logout', icon: LogOut },
      ],
    },
  ],
};

export function getNavForRole(role: UserRole | string | undefined): NavSection[] {
  if (!role) return [];
  return ROLE_NAV[role] ?? [];
}
