'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, BookOpen, CheckCircle2, FileText, PlayCircle, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState, LoadingState } from '@/components/dashboard/data-states';
import { API_URL } from '@/lib/api/client';
import { useStudentCourseDetail } from '@/lib/api/hooks';
import { useParams } from 'next/navigation';

interface Lesson {
  id: string;
  title: string;
  durationMinutes?: number | null;
  hasVideo?: boolean;
  hasPdf?: boolean;
  hasAttachments?: boolean;
  videos?: { id: string; title?: string | null; url: string; source?: string | null }[];
}

interface Chapter {
  id: string;
  title: string;
  lessons?: Lesson[];
}

interface Resource {
  id: string;
  title: string;
  type?: string | null;
  fileUrl?: string | null;
  mimeType?: string | null;
}

interface StudentCourseDetail {
  course?: { id: string; title: string; description?: string | null; level?: string | null; totalLessons?: number; resources?: Resource[] };
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
  const resources = detail.course.resources ?? [];
  const resourceUrl = (url: string) => url.startsWith('http') ? url : `${API_URL.replace(/\/api\/v1$/, '')}${url}`;
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

      {resources.length > 0 && <Card><CardHeader><CardTitle className="text-base">Course materials</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{resources.map((resource) => { const isImage = resource.mimeType?.startsWith('image/') || resource.type === 'IMAGE'; const url = resource.fileUrl ? resourceUrl(resource.fileUrl) : ''; return <a key={resource.id} href={url || '#'} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted">{isImage && url ? <Image src={url} alt={resource.title} width={48} height={48} unoptimized className="h-12 w-12 rounded-md object-cover" /> : <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-md"><FileText className="text-primary h-4 w-4" /></div>}<div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{resource.title}</p><p className="text-muted-foreground text-xs">{isImage ? 'Image' : resource.type ?? 'File'}</p></div><span className="text-primary text-xs">Open</span></a>; })}</CardContent></Card>}

      {chapters.length === 0 ? <EmptyState title="No lessons yet" description="This course does not have published lessons yet." /> : <div className="space-y-4">{chapters.map((chapter, chapterIndex) => <Card key={chapter.id}><CardHeader><CardTitle className="text-base">Chapter {chapterIndex + 1}: {chapter.title}</CardTitle></CardHeader><CardContent className="space-y-2">{(chapter.lessons ?? []).map((lesson, lessonIndex) => <div key={lesson.id} className="rounded-lg border p-3"><div className="flex items-center gap-3"><span className="text-muted-foreground w-6 text-sm">{lessonIndex + 1}</span><div className="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-md">{lesson.hasVideo ? <Video className="text-primary h-4 w-4" /> : <FileText className="text-primary h-4 w-4" />}</div><div className="min-w-0 flex-1"><p className="font-medium">{lesson.title}</p><p className="text-muted-foreground text-xs">{lesson.durationMinutes ? `${lesson.durationMinutes} minutes` : 'Lesson content'}</p></div><div className="flex items-center gap-2">{lesson.hasVideo && <Badge variant="outline"><PlayCircle className="mr-1 h-3 w-3" />Video</Badge>}{lesson.hasPdf && <Badge variant="outline"><FileText className="mr-1 h-3 w-3" />PDF</Badge>}{lesson.hasAttachments && <Badge variant="outline">Files</Badge>}<CheckCircle2 className="text-muted-foreground h-4 w-4" /></div></div>{lesson.videos?.map((video) => { const youtubeUrl = getYouTubeEmbedUrl(video.url); return <div key={video.id} className="mt-3 space-y-2"><p className="text-sm font-medium">{video.title || 'Lesson video'}</p>{youtubeUrl ? <iframe title={video.title || 'Lesson video'} src={youtubeUrl} className="aspect-video w-full rounded-md" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : <video controls preload="metadata" className="aspect-video w-full rounded-md bg-black" src={video.url}>Your browser does not support video playback.</video>}</div>; })}</div>)}{!(chapter.lessons ?? []).length && <p className="text-muted-foreground text-sm">No lessons in this chapter.</p>}</CardContent></Card>)}</div>}
    </div>
  );
}

function getYouTubeEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    const videoId = parsed.hostname.includes('youtu.be')
      ? parsed.pathname.slice(1)
      : parsed.searchParams.get('v') ?? parsed.pathname.split('/').pop();
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  } catch {
    return null;
  }
}