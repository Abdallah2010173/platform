'use client';

import { Users, BookOpen, FolderOpen, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminUserStats, useCourseStats, useCategories } from '@/lib/api/hooks';
import { LoadingState } from '@/components/dashboard/data-states';

interface UserStats {
  total?: number;
  admins?: number;
  teachers?: number;
  students?: number;
  active?: number;
  inactive?: number;
  [key: string]: unknown;
}

interface CourseStat {
  total?: number;
  published?: number;
  draft?: number;
  pendingReview?: number;
  archived?: number;
  featured?: number;
  [key: string]: unknown;
}

export default function AdminDashboardPage() {
  const { data: userStats, isLoading: loadingUsers } = useAdminUserStats();
  const { data: courseStats, isLoading: loadingCourses } = useCourseStats();
  const { data: categoriesData, isLoading: loadingCategories } = useCategories({ limit: '100' });

  const users = (userStats as UserStats | undefined) ?? {};
  const courses = (courseStats as CourseStat | undefined) ?? {};

  const categoryList = Array.isArray(categoriesData)
    ? (categoriesData as Record<string, unknown>[])
    : ((categoriesData as { items?: Record<string, unknown>[] })?.items ?? []);
  const totalCategories = categoryList.length;

  if (loadingUsers || loadingCourses || loadingCategories) {
    return <LoadingState label="Loading admin dashboard..." />;
  }

  const cards = [
    { label: 'Total Users', value: String(users.total ?? 0), icon: Users },
    { label: 'Students', value: String(users.students ?? 0), icon: Users },
    { label: 'Teachers', value: String(users.teachers ?? 0), icon: Users },
    {
      label: 'Total Courses',
      value: String(courses.total ?? 0),
      icon: BookOpen,
    },
    {
      label: 'Categories',
      value: String(totalCategories),
      icon: FolderOpen,
    },
    {
      label: 'Published Courses',
      value: String(courses.published ?? 0),
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
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
              <p className="text-2xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
