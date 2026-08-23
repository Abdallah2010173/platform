'use client';

import { FormEvent, useState } from 'react';
import { useParams } from 'next/navigation';
import { Plus, Trash2, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState, LoadingState } from '@/components/dashboard/data-states';
import { useAddChapter, useAddLesson, useAddLessonVideo, useCourseDetail, useDeleteLessonVideo } from '@/lib/api/hooks';

interface VideoItem { id: string; title?: string; url?: string; description?: string }
interface Lesson { id: string; title: string; description?: string; videos?: VideoItem[] }
interface Chapter { id: string; title: string; lessons?: Lesson[] }
interface Course { id: string; title: string; description?: string; chapters?: Chapter[] }

export default function TeacherCourseContentPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;
  const { data, isLoading } = useCourseDetail(courseId);
  const addChapter = useAddChapter(courseId);
  const addLesson = useAddLesson(courseId);
  const addVideo = useAddLessonVideo(courseId);
  const deleteVideo = useDeleteLessonVideo(courseId);
  const [chapterTitle, setChapterTitle] = useState('');
  const [lessonTitles, setLessonTitles] = useState<Record<string, string>>({});
  const [videoForms, setVideoForms] = useState<Record<string, { title: string; url: string }>>({});
  const course = data as Course | undefined;
  const chapters = course?.chapters ?? [];

  const submitChapter = (event: FormEvent) => {
    event.preventDefault();
    if (!chapterTitle.trim()) return;
    addChapter.mutate({ title: chapterTitle.trim() }, { onSuccess: () => setChapterTitle('') });
  };

  const submitLesson = (event: FormEvent, chapterId: string) => {
    event.preventDefault();
    const title = lessonTitles[chapterId]?.trim();
    if (!title) return;
    addLesson.mutate({ chapterId, data: { title } }, { onSuccess: () => setLessonTitles({ ...lessonTitles, [chapterId]: '' }) });
  };

  const submitVideo = (event: FormEvent, lessonId: string) => {
    event.preventDefault();
    const form = videoForms[lessonId];
    if (!form?.url.trim()) return;
    addVideo.mutate({ lessonId, data: { title: form.title.trim() || undefined, url: form.url.trim() } }, { onSuccess: () => setVideoForms({ ...videoForms, [lessonId]: { title: '', url: '' } }) });
  };

  if (isLoading) return <LoadingState label="Loading course content..." />;
  if (!course) return <EmptyState title="Course not found" />;

  return (
    <div className="space-y-6">
      <div><h1 className="text-xl font-semibold">{course.title}</h1><p className="text-muted-foreground text-sm">Organize chapters, lessons, and video content.</p></div>
      <Card><CardHeader><CardTitle className="text-base">Add chapter</CardTitle></CardHeader><CardContent><form onSubmit={submitChapter} className="flex gap-2"><Input value={chapterTitle} onChange={(event) => setChapterTitle(event.target.value)} placeholder="Chapter title" /><Button type="submit" disabled={addChapter.isPending}><Plus className="mr-2 h-4 w-4" />Add chapter</Button></form></CardContent></Card>
      {chapters.length === 0 ? <EmptyState title="No chapters yet" description="Add a chapter to start building this course." /> : chapters.map((chapter) => <Card key={chapter.id}><CardHeader><CardTitle className="text-base">{chapter.title}</CardTitle></CardHeader><CardContent className="space-y-4"><form onSubmit={(event) => submitLesson(event, chapter.id)} className="flex gap-2"><Input value={lessonTitles[chapter.id] ?? ''} onChange={(event) => setLessonTitles({ ...lessonTitles, [chapter.id]: event.target.value })} placeholder="Lesson title" /><Button type="submit" variant="outline" disabled={addLesson.isPending}><Plus className="mr-2 h-4 w-4" />Add lesson</Button></form>{(chapter.lessons ?? []).map((lesson) => { const form = videoForms[lesson.id] ?? { title: '', url: '' }; return <div key={lesson.id} className="rounded-md border p-3"><div className="flex items-center justify-between gap-3"><div><p className="font-medium">{lesson.title}</p><p className="text-muted-foreground text-xs">{lesson.videos?.length ?? 0} video(s)</p></div><Badge variant="secondary">Lesson</Badge></div><div className="mt-3 space-y-2">{(lesson.videos ?? []).map((video) => <div key={video.id} className="flex items-center gap-2 text-sm"><Video className="text-primary h-4 w-4" /><a className="min-w-0 flex-1 truncate underline" href={video.url} target="_blank" rel="noreferrer">{video.title || video.url}</a><Button type="button" variant="ghost" size="icon" aria-label="Delete video" onClick={() => { if (window.confirm('Delete this video?')) deleteVideo.mutate(video.id); }}><Trash2 className="text-destructive h-4 w-4" /></Button></div>)}<form onSubmit={(event) => submitVideo(event, lesson.id)} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]"><Input value={form.title} onChange={(event) => setVideoForms({ ...videoForms, [lesson.id]: { ...form, title: event.target.value } })} placeholder="Video title" /><Input type="url" required value={form.url} onChange={(event) => setVideoForms({ ...videoForms, [lesson.id]: { ...form, url: event.target.value } })} placeholder="https://... video URL" /><Button type="submit" disabled={addVideo.isPending}><Video className="mr-2 h-4 w-4" />Attach</Button></form></div></div>; })}</CardContent></Card>)}
    </div>
  );
}
