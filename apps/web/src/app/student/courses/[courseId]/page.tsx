'use client';

import Link from 'next/link';
import { ArrowLeft, BookOpen, CheckCircle2, FileText, PlayCircle, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState, LoadingState } from '@/components/dashboard/data-states';
import { useStudentCourseDetail } from '@/lib/api/hooks';
import { useParams } from 'next/navigation';

interface Lesson {
  id: string;
  title: string;
  durationMinutes?: number | null;
  hasVideo?: boolean;
  hasPdf?: boolean;
  hasAttachments?: boolean;
}

interface Chapter {
  id: string;
  title: string;
  lessons?: Lesson[];
}

interface StudentCourseDetail {
  course?: { id: string; title: string; description?: string | null; level?: string | null; totalLessons?: number };
  chapters?: Chapter[];
  enrollment?: { progress?: number; status?: string };
}

export default function StudentCourseDetailPage() {
  const params = useParams<{ courseId: string }>();
  const { data, isLoading, isError } = useStudentCourseDetail(params.courseId);
  const detail = data as StudentCourseDetail | undefined;

  if (isLoading) return <LoadingState label="Loading course content..." />;
  if (isError || !detail?.course) {
    return <EmptyState title="Course not found" description="You may not have access to this course." action={<Button asChild variant="outline"><Link href="/student/courses">Back to my courses</Link></Button>} />;
  }

  const chapters = detail.chapters ?? [];
  const lessonCount = chapters.reduce((total, chapter) => total + (chapter.lessons?.length ?? 0), 0);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" className="-ml-3">
        <Link href="/student/courses"><ArrowLeft className="mr-2 h-4 w-4" />Back to my courses</Link>
      </Button>

      <Card className="overflow-hidden">
        <CardHeader className="bg-primary/5 border-b">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="bg-primary/10 flex h-11 w-11 items-center justify-center rounded-lg"><BookOpen className="text-primary h-6 w-6" /></div>
              <CardTitle className="text-2xl">{detail.course.title}</CardTitle>
              {detail.course.description && <p className="text-muted-foreground max-w-3xl text-sm">{detail.course.description}</p>}
            </div>
            <Badge variant="secondary">{detail.enrollment?.status ?? 'ACTIVE'}</Badge>
          </div>
          <div className="text-muted-foreground flex flex-wrap gap-4 pt-2 text-sm">
            <span>{detail.course.totalLessons ?? lessonCount} lessons</span>
            {detail.course.level && <span>{detail.course.level}</span>}
            {detail.enrollment?.progress != null && <span>{detail.enrollment.progress}% complete</span>}
          </div>
        </CardHeader>
      </Card>

      {chapters.length === 0 ? <EmptyState title="No lessons yet" description="This course does not have published lessons yet." /> : <div className="space-y-4">{chapters.map((chapter, chapterIndex) => <Card key={chapter.id}><CardHeader><CardTitle className="text-base">Chapter {chapterIndex + 1}: {chapter.title}</CardTitle></CardHeader><CardContent className="space-y-2">{(chapter.lessons ?? []).map((lesson, lessonIndex) => <div key={lesson.id} className="flex items-center gap-3 rounded-lg border p-3"><span className="text-muted-foreground w-6 text-sm">{lessonIndex + 1}</span><div className="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-md">{lesson.hasVideo ? <Video className="text-primary h-4 w-4" /> : <FileText className="text-primary h-4 w-4" />}</div><div className="min-w-0 flex-1"><p className="font-medium">{lesson.title}</p><p className="text-muted-foreground text-xs">{lesson.durationMinutes ? `${lesson.durationMinutes} minutes` : 'Lesson content'}</p></div><div className="flex items-center gap-2">{lesson.hasVideo && <Badge variant="outline"><PlayCircle className="mr-1 h-3 w-3" />Video</Badge>}{lesson.hasPdf && <Badge variant="outline"><FileText className="mr-1 h-3 w-3" />PDF</Badge>}{lesson.hasAttachments && <Badge variant="outline">Files</Badge>}<CheckCircle2 className="text-muted-foreground h-4 w-4" /></div></div>)}{!(chapter.lessons ?? []).length && <p className="text-muted-foreground text-sm">No lessons in this chapter.</p>}</CardContent></Card>)}</div>}
    </div>
  );
}