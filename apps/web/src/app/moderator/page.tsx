'use client';

import { BookOpen, FolderOpen, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useModeratorStats } from '@/lib/api/hooks';
import { LoadingState } from '@/components/dashboard/data-states';

interface ModeratorStats {
  totalCourses?: number;
  publishedCourses?: number;
  pendingReview?: number;
  totalCategories?: number;
  [key: string]: unknown;
}

export default function ModeratorDashboardPage() {
  const { data, isLoading } = useModeratorStats();

  const stats = (data as ModeratorStats | undefined) ?? {};

  if (isLoading) {
    return <LoadingState label="Loading moderator dashboard..." />;
  }

  const cards = [
    { label: 'Total Courses', value: stats.totalCourses ?? 0, icon: BookOpen },
    {
      label: 'Published Courses',
      value: stats.publishedCourses ?? 0,
      icon: TrendingUp,
    },
    {
      label: 'Pending Review',
      value: stats.pendingReview ?? 0,
      icon: Clock,
    },
    { label: 'Total Categories', value: stats.totalCategories ?? 0, icon: FolderOpen },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
