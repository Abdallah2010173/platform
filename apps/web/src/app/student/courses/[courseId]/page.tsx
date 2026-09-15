'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState, LoadingState } from '@/components/dashboard/data-states';
import { API_URL } from '@/lib/api/client';
import { useCompleteStudentLesson, useStudentCourseDetail } from '@/lib/api/hooks';
import { ProtectedHlsVideo } from '@/components/protected-hls-video';
import { useParams } from 'next/navigation';

interface ContentBlock {
  id: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'PDF' | 'FILE' | 'EMBED' | string;
  title?: string | null;
  orderIndex: number;
  data: { text?: string; url?: string; videoId?: string };
}
interface Lesson {
  id: string;
  title: string;
  durationMinutes?: number | null;
  isCompleted?: boolean;
  contentBlocks?: ContentBlock[];
  videos?: { id: string; title?: string | null; url: string; source?: string | null; transcodingStatus?: string | null }[];
  pdfs?: { id: string; title: string; url?: string | null }[];
  attachments?: { id: string; title: string; fileUrl?: string | null; fileName?: string | null }[];
}
interface StudentCourseDetail {
  course?: { id: string; title: string; description?: string | null; totalLessons?: number };
  chapters?: { id: string; title: string; lessons?: Lesson[] }[];
  enrollment?: { progress?: number; status?: string };
}

export default function StudentCourseDetailPage() {
  const params = useParams<{ courseId: string }>();
  const { data, isLoading, isError } = useStudentCourseDetail(params.courseId);
  const completeLesson = useCompleteStudentLesson(params.courseId);
  const detail = data as StudentCourseDetail | undefined;
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const lessons = (detail?.chapters ?? []).flatMap((chapter) => chapter.lessons ?? []);
  const selectedIndex = Math.max(0, lessons.findIndex((lesson) => lesson.id === selectedLessonId));
  const selectedLesson = lessons[selectedIndex];

  useEffect(() => {
    if (!selectedLessonId && lessons[0]) setSelectedLessonId(lessons[0].id);
  }, [lessons, selectedLessonId]);

  if (isLoading) return <LoadingState label="Loading course player..." />;
  if (isError || !detail?.course) return <EmptyState title="Course not found" description="You may not have access to this course." action={<Button asChild variant="outline"><Link href="/student/courses">Back to my courses</Link></Button>} />;
  if (!selectedLesson) return <EmptyState title="No lessons yet" description="This course does not have published lessons yet." />;

  const resourceUrl = (url: string) => url.startsWith('http') ? url : `${API_URL.replace(/\/api\/v1$/, '')}${url}`;
  const blocks = [...(selectedLesson.contentBlocks ?? [])].sort((a, b) => a.orderIndex - b.orderIndex);
  const previousLesson = lessons[selectedIndex - 1];
  const nextLesson = lessons[selectedIndex + 1];

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" className="-ml-3"><Link href="/student/courses"><ArrowLeft className="mr-2 h-4 w-4" />Back to my courses</Link></Button>
      <div className="grid min-h-[70vh] gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col rounded-lg border bg-card">
          <div className="border-b p-4"><p className="text-muted-foreground text-xs">Course</p><h1 className="mt-1 font-semibold">{detail.course.title}</h1><p className="text-muted-foreground mt-2 text-sm">{detail.course.totalLessons ?? lessons.length} lessons</p>{detail.enrollment?.progress != null && <p className="text-primary mt-1 text-xs">{detail.enrollment.progress}% complete</p>}</div>
          <nav aria-label="Course lessons" className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
            {lessons.map((lesson, index) => { const active = lesson.id === selectedLesson.id; return <button key={lesson.id} type="button" onClick={() => setSelectedLessonId(lesson.id)} className={`flex w-full items-center gap-2 rounded-md p-3 text-left text-sm transition-colors ${active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs">{lesson.isCompleted ? <Check className="h-3.5 w-3.5" /> : index + 1}</span><span className="min-w-0 flex-1 truncate">{lesson.title}</span>{active && <ChevronRight className="h-4 w-4 shrink-0" />}</button>; })}
          </nav>
        </aside>
        <main className="min-w-0"><Card><CardHeader className="border-b"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-muted-foreground text-sm">Lesson {selectedIndex + 1} of {lessons.length}</p><CardTitle className="mt-1 text-2xl">{selectedLesson.title}</CardTitle></div><Badge variant={selectedLesson.isCompleted ? 'secondary' : 'outline'}>{selectedLesson.isCompleted ? 'Completed' : 'In progress'}</Badge></div></CardHeader><CardContent className="space-y-6 p-4 sm:p-6">{blocks.length ? blocks.map((block) => <ContentBlockView key={block.id} block={block} videos={selectedLesson.videos ?? []} resourceUrl={resourceUrl} />) : <LegacyContent lesson={selectedLesson} resourceUrl={resourceUrl} />}<div className="flex flex-wrap items-center justify-between gap-2 border-t pt-5"><Button type="button" variant="outline" disabled={!previousLesson} onClick={() => previousLesson && setSelectedLessonId(previousLesson.id)}><ChevronLeft className="mr-2 h-4 w-4" />Previous</Button><Button type="button" disabled={selectedLesson.isCompleted || completeLesson.isPending} onClick={() => completeLesson.mutate(selectedLesson.id)}>{selectedLesson.isCompleted ? <><Check className="mr-2 h-4 w-4" />Completed</> : 'Mark complete'}</Button><Button type="button" disabled={!nextLesson} onClick={() => nextLesson && setSelectedLessonId(nextLesson.id)}>Next<ChevronRight className="ml-2 h-4 w-4" /></Button></div></CardContent></Card></main>
      </div>
    </div>
  );
}

function ContentBlockView({ block, videos, resourceUrl }: { block: ContentBlock; videos: Lesson['videos']; resourceUrl: (url: string) => string }) {
  const video = block.data.videoId ? videos?.find((item) => item.id === block.data.videoId) : undefined;
  const url = block.data.url;
  return <section className="space-y-2">{block.title && <h2 className="font-semibold">{block.title}</h2>}{block.type === 'TEXT' && <p className="whitespace-pre-wrap leading-7">{block.data.text}</p>}{block.type === 'IMAGE' && url && <Image src={resourceUrl(url)} alt={block.title || 'Lesson image'} width={1200} height={700} unoptimized className="h-auto max-h-[38rem] w-full rounded-md object-contain" />}{block.type === 'VIDEO' && (video || url) && <VideoBlock video={video} url={url} title={block.title || 'Lesson video'} />}{(block.type === 'PDF' || block.type === 'FILE') && url && <a href={resourceUrl(url)} target="_blank" rel="noreferrer" className="hover:bg-muted flex items-center gap-3 rounded-md border p-4"><FileText className="text-primary h-5 w-5" /><span className="flex-1">{block.title || 'Open file'}</span><ArrowRight className="h-4 w-4" /></a>}{block.type === 'EMBED' && url && <iframe title={block.title || 'Lesson embed'} src={url} className="aspect-video w-full rounded-md border" allowFullScreen />}</section>;
}

function VideoBlock({ video, url, title }: { video?: NonNullable<Lesson['videos']>[number]; url?: string; title: string }) {
  if (video && (video.source === 'UPLOAD' || video.url.startsWith('uploads/') || video.url.startsWith('videos/'))) return <ProtectedHlsVideo videoId={video.id} fallbackUrl={video.url} title={title} />;
  const videoUrl = video?.url ?? url;
  if (!videoUrl) return null;
  const youtube = getYouTubeEmbedUrl(videoUrl);
  return youtube ? <iframe title={title} src={youtube} className="aspect-video w-full rounded-md" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : <video controls preload="metadata" className="aspect-video w-full rounded-md bg-black" src={videoUrl} />;
}

function LegacyContent({ lesson, resourceUrl }: { lesson: Lesson; resourceUrl: (url: string) => string }) {
  return <div className="space-y-4">{lesson.videos?.map((video) => <VideoBlock key={video.id} video={video} title={video.title || 'Lesson video'} />)}{lesson.pdfs?.map((pdf) => pdf.url && <a key={pdf.id} href={resourceUrl(pdf.url)} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-md border p-4"><FileText className="text-primary h-5 w-5" />{pdf.title}</a>)}{lesson.attachments?.map((file) => file.fileUrl && <a key={file.id} href={resourceUrl(file.fileUrl)} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-md border p-4"><FileText className="text-primary h-5 w-5" />{file.title || file.fileName}</a>)}</div>;
}

function getYouTubeEmbedUrl(url: string) {
  try { const parsed = new URL(url); const videoId = parsed.hostname.includes('youtu.be') ? parsed.pathname.slice(1) : (parsed.searchParams.get('v') ?? parsed.pathname.split('/').pop()); return videoId ? `https://www.youtube.com/embed/${videoId}` : null; } catch { return null; }
}
