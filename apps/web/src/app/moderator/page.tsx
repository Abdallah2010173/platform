'use client';

import { Users, BookOpen, FolderOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminUserStats, useCourseStats } from '@/lib/api/hooks';
import { LoadingState } from '@/components/dashboard/data-states';

interface UserStats {
  totalUsers?: number;
  totalStudents?: number;
  [key: string]: unknown;
}

interface CourseStat {
  totalCourses?: number;
  totalCategories?: number;
  [key: string]: unknown;
}

export default function ModeratorDashboardPage() {
  const { data: userStats, isLoading: loadingUsers } = useAdminUserStats();
  const { data: courseStats, isLoading: loadingCourses } = useCourseStats();

  const users = (userStats as UserStats | undefined) ?? {};
  const courses = (courseStats as CourseStat | undefined) ?? {};

  if (loadingUsers || loadingCourses) {
    return <LoadingState label="Loading moderator dashboard..." />;
  }

  const cards = [
    { label: 'Total Users', value: users.totalUsers ?? 0, icon: Users },
    { label: 'Total Courses', value: courses.totalCourses ?? 0, icon: BookOpen },
    { label: 'Total Categories', value: courses.totalCategories ?? 0, icon: FolderOpen },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">{c.label}</CardTitle>
            <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-lg">
              <c.icon className="text-primary h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{String(c.value)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
