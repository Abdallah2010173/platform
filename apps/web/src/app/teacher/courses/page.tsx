'use client';

import { BookOpen, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTeacherCourses } from '@/lib/api/hooks';
import { LoadingState, EmptyState } from '@/components/dashboard/data-states';

interface CourseItem {
  id: string;
  title: string;
  status?: string;
  isPublished?: boolean;
  _count?: { students?: number; lessons?: number };
  totalStudents?: number;
  totalLessons?: number;
  durationMinutes?: number;
  [key: string]: unknown;
}

export default function TeacherCoursesPage() {
  const { data, isLoading } = useTeacherCourses();

  const courses = Array.isArray(data)
    ? (data as CourseItem[])
    : ((data as { items?: CourseItem[] })?.items ?? []);

  if (isLoading) return <LoadingState label="Loading your courses..." />;

  if (courses.length === 0) {
    return (
      <EmptyState title="No courses yet" description="Your created courses will appear here." />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <Card key={course.id}>
          <CardHeader className="flex flex-row items-start justify-between">
            <CardTitle className="text-base">{course.title}</CardTitle>
            <Badge variant={course.isPublished ? 'default' : 'secondary'}>
              {course.isPublished ? 'Published' : String(course.status ?? 'DRAFT')}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-muted-foreground flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {String(course.totalStudents ?? course._count?.students ?? 0)} students
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {String(course.totalLessons ?? course._count?.lessons ?? 0)} lessons
              </span>
            </div>
            {course.durationMinutes ? (
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <Clock className="h-3.5 w-3.5" />
                {String(course.durationMinutes)} min
              </span>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
