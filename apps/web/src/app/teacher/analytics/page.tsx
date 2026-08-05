'use client';

import { TrendingUp, Users, BookOpen, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTeacherAnalytics } from '@/lib/api/hooks';
import { LoadingState, EmptyState } from '@/components/dashboard/data-states';

interface AnalyticsData {
  totalStudents?: number;
  totalCourses?: number;
  averageRating?: number | string;
  totalEnrollments?: number;
  completionRate?: number;
  [key: string]: unknown;
}

export default function TeacherAnalyticsPage() {
  const { data, isLoading } = useTeacherAnalytics();

  const analytics = (data as AnalyticsData | undefined) ?? {};

  if (isLoading) return <LoadingState label="Loading analytics..." />;

  const cards = [
    { label: 'Total Students', value: String(analytics.totalStudents ?? 0), icon: Users },
    { label: 'Total Courses', value: String(analytics.totalCourses ?? 0), icon: BookOpen },
    { label: 'Avg Rating', value: String(analytics.averageRating ?? '0'), icon: Award },
    {
      label: 'Completion Rate',
      value: `${String(analytics.completionRate ?? 0)}%`,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
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
              <p className="text-2xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {Object.keys(analytics).length === 0 && (
        <EmptyState
          title="No analytics"
          description="Analytics will appear once you have activity."
        />
      )}
    </div>
  );
}
