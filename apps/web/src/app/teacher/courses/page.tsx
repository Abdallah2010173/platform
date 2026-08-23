'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Users, Clock, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTeacherCourses, useCreateCourse } from '@/lib/api/hooks';
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
  const [title, setTitle] = useState('');
  const [introVideoUrl, setIntroVideoUrl] = useState('');
  const { data, isLoading } = useTeacherCourses();
  const createCourse = useCreateCourse();

  const courses = Array.isArray(data)
    ? (data as CourseItem[])
    : ((data as { items?: CourseItem[] })?.items ?? []);

  if (isLoading) return <LoadingState label="Loading your courses..." />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Create a course</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Input placeholder="Course title" value={title} onChange={(event) => setTitle(event.target.value)} />
          <Input type="url" placeholder="Intro video URL (optional)" value={introVideoUrl} onChange={(event) => setIntroVideoUrl(event.target.value)} />
          <Button disabled={title.trim().length < 3 || createCourse.isPending} onClick={() => createCourse.mutate({ title: title.trim(), introVideoUrl: introVideoUrl.trim() || undefined }, { onSuccess: () => { setTitle(''); setIntroVideoUrl(''); } })}>
            <Plus className="mr-2 h-4 w-4" />Create
          </Button>
        </CardContent>
      </Card>
      {courses.length === 0 ? <EmptyState title="No courses yet" description="Create your first course above." /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            <Button asChild variant="outline" size="sm">
              <Link href={`/teacher/courses/${course.id}`}>Manage content</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
      </div>}
    </div>
  );
}
