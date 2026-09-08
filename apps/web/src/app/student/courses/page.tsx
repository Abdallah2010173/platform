'use client';

import { BookOpen, MessageCircle, PlayCircle } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEnrollCourse, usePublishedCourses, useRedeemAccessCode, useStudentCourses } from '@/lib/api/hooks';
import { LoadingState, EmptyState } from '@/components/dashboard/data-states';
import { Progress } from '@/components/ui/progress';

interface CourseItem {
  id: string;
  courseId?: string;
  title: string;
  status: string;
  progress?: number;
  totalLessons?: number;
  completedLessons?: number;
  [key: string]: unknown;
}

interface PublishedCourse {
  id: string;
  title: string;
  description?: string | null;
  price?: number | string | null;
  discountPrice?: number | string | null;
  isFree?: boolean;
  [key: string]: unknown;
}

function AccessCodeEntry() {
  const redeemAccessCode = useRedeemAccessCode();
  const [code, setCode] = useState('');

  return <Card><CardHeader><CardTitle className="text-base">Contact teacher to pay</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-muted-foreground text-sm">Have an access code from your teacher? Enter it to open the course.</p><div className="flex gap-2"><Input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="Enter code" maxLength={32} /><Button type="button" disabled={!code.trim() || redeemAccessCode.isPending} onClick={() => redeemAccessCode.mutate(code, { onSuccess: () => setCode('') })}>Unlock</Button></div></CardContent></Card>;
}

export default function StudentCoursesPage() {
  const { data, isLoading, isError } = useStudentCourses();
  const { data: publishedData, isLoading: isLoadingPublished } = usePublishedCourses();
  const enrollCourse = useEnrollCourse();

  const courses: CourseItem[] = Array.isArray(data)
    ? (data as CourseItem[])
    : ((data as { courses?: CourseItem[] })?.courses ?? []);
  const publishedCourses: PublishedCourse[] = Array.isArray(publishedData)
    ? (publishedData as PublishedCourse[])
    : ((publishedData as { items?: PublishedCourse[] })?.items ?? []);
  const enrolledCourseIds = new Set(courses.map((course) => course.courseId ?? course.id));
  const availableCourses = publishedCourses.filter((course) => !enrolledCourseIds.has(course.id));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">My Courses</h2>
        <p className="text-muted-foreground text-sm">Courses you are enrolled in</p>
      </div>

      {isLoading ? (
        <LoadingState label="Loading your courses..." />
      ) : isError || courses.length === 0 ? (
        <EmptyState title="No courses yet" description="Enroll in a course to start learning." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                    <BookOpen className="text-primary h-5 w-5" />
                  </div>
                  <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                    {String(course.status)}
                  </span>
                </div>
                <CardTitle className="mt-3 text-base">{String(course.title)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {course.progress != null && (
                  <div className="space-y-1">
                    <div className="text-muted-foreground flex justify-between text-xs">
                      <span>Progress</span>
                      <span>{course.progress}%</span>
                    </div>
                    <Progress value={Number(course.progress)} className="h-1.5" />
                  </div>
                )}
                <Button asChild variant="outline" className="w-full">
                  <a href={`/student/courses/${course.courseId ?? course.id}`}>
                    <PlayCircle className="mr-2 h-4 w-4" /> Continue Learning
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <AccessCodeEntry />
      <div className="pt-4">
        <h2 className="text-lg font-semibold">Available Courses</h2>
        <p className="text-muted-foreground text-sm">Enroll to access course content and contact its instructors.</p>
      </div>
      {isLoadingPublished ? <LoadingState label="Loading available courses..." /> : availableCourses.length === 0 ? <EmptyState title="No additional courses available" description="New published courses will appear here." /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{availableCourses.map((course) => { const price = Number(course.discountPrice ?? course.price ?? 0); const isPaid = !course.isFree && price > 0; return <Card key={course.id}><CardHeader><CardTitle className="text-base">{course.title}</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-muted-foreground line-clamp-2 text-sm">{course.description || 'Course content is available after enrollment.'}</p><p className="font-semibold">{isPaid ? `Price: ${price} ${String(course.currency ?? 'USD')}` : 'Free'}</p>{isPaid ? <Button asChild className="w-full"><a href="/student/messages"><MessageCircle className="mr-2 h-4 w-4" />Contact teacher to pay</a></Button> : <Button className="w-full" disabled={enrollCourse.isPending} onClick={() => enrollCourse.mutate(course.id)}>Enroll free</Button>}</CardContent></Card>; })}</div>}
    </div>
  );
}
