'use client';

import { TrendingUp, Users, BookOpen, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTeacherAnalytics } from '@/lib/api/hooks';
import { LoadingState, EmptyState } from '@/components/dashboard/data-states';

interface CourseAnalytics {
  id: string;
  title?: string;
  isPublished?: boolean;
  status?: string;
  totalStudents?: number;
  averageRating?: number;
  ratingCount?: number;
  revenue?: number;
  views?: number;
  completionRate?: number | null;
  activeStudents?: number;
  [key: string]: unknown;
}

interface AnalyticsData {
  courses?: CourseAnalytics[];
  [key: string]: unknown;
}

export default function TeacherAnalyticsPage() {
  const { data, isLoading } = useTeacherAnalytics();

  const analytics = (data as AnalyticsData | undefined) ?? {};
  const courses = analytics.courses ?? [];

  if (isLoading) return <LoadingState label="Loading analytics..." />;

  const totalStudents = courses.reduce((sum, c) => sum + (c.totalStudents ?? 0), 0);
  const activeStudents = courses.reduce((sum, c) => sum + (c.activeStudents ?? 0), 0);
  const avgRating =
    courses.length > 0
      ? courses.reduce((sum, c) => sum + (c.averageRating ?? 0), 0) / courses.length
      : 0;
  const avgCompletion =
    courses.length > 0
      ? courses.reduce((sum, c) => sum + (c.completionRate ?? 0), 0) / courses.length
      : 0;
  const totalRevenue = courses.reduce((sum, c) => sum + (c.revenue ?? 0), 0);
  const publishedCount = courses.filter((c) => c.isPublished).length;

  const cards = [
    { label: 'Total Courses', value: String(courses.length), icon: BookOpen },
    { label: 'Published', value: String(publishedCount), icon: TrendingUp },
    { label: 'Total Students', value: String(totalStudents), icon: Users },
    { label: 'Active Students', value: String(activeStudents), icon: Users },
    { label: 'Avg Rating', value: avgRating.toFixed(2), icon: Award },
    {
      label: 'Completion Rate',
      value: `${avgCompletion.toFixed(1)}%`,
      icon: TrendingUp,
    },
    { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: Award },
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

      {courses.length === 0 ? (
        <EmptyState
          title="No analytics"
          description="Analytics will appear once you have activity."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Course Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="flex items-center justify-between border-b py-2 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{String(course.title ?? '')}</p>
                  <p className="text-muted-foreground text-xs">
                    {course.totalStudents ?? 0} students • {course.views ?? 0} views •{' '}
                    {course.isPublished ? 'Published' : String(course.status ?? 'Draft')}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium">{Number(course.averageRating ?? 0).toFixed(1)} ★</p>
                  <p className="text-muted-foreground text-xs">
                    {course.completionRate != null ? `${course.completionRate}%` : '—'} complete
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
