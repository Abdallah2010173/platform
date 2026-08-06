'use client';

import { Users, BookOpen, FolderOpen, TrendingUp, Clock } from 'lucide-react';
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

export default function AdminAnalyticsPage() {
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
    return <LoadingState label="Loading analytics..." />;
  }

  const stats = [
    {
      label: 'Total Users',
      value: users.total ?? 0,
      icon: Users,
    },
    {
      label: 'Active Users',
      value: users.active ?? 0,
      icon: TrendingUp,
    },
    {
      label: 'Total Courses',
      value: courses.total ?? 0,
      icon: BookOpen,
    },
    {
      label: 'Published Courses',
      value: courses.published ?? 0,
      icon: TrendingUp,
    },
    {
      label: 'Pending Review',
      value: courses.pendingReview ?? 0,
      icon: Clock,
    },
    {
      label: 'Total Categories',
      value: totalCategories,
      icon: FolderOpen,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">{s.label}</CardTitle>
            <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-lg">
              <s.icon className="text-primary h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{String(s.value)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
