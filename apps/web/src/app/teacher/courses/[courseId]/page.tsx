'use client';

import { FormEvent, useState } from 'react';
import { useParams } from 'next/navigation';
import { FileText, Gift, Plus, Trash2, Upload, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EmptyState, LoadingState } from '@/components/dashboard/data-states';
import { API_URL } from '@/lib/api/client';
import {
  useAddChapter,
  useAddLesson,
  useAddLessonVideo,
  useAllTeacherStudents,
  useCourseDetail,
  useDeleteLessonVideo,
  useGrantCourseAccess,
  useUploadCourseResource,
  useUploadLessonVideo,
} from '@/lib/api/hooks';

interface VideoItem { id: string; title?: string; url?: string }
interface Lesson { id: string; title: string; videos?: VideoItem[] }
interface Chapter { id: string; title: string; lessons?: Lesson[] }
interface Resource { id: string; title: string; fileUrl?: string | null }
interface Student { userId: string; name?: string; email: string }
interface Course { id: string; title: string; chapters?: Chapter[]; resources?: Resource[] }

export default function TeacherCourseContentPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;
  const { data, isLoading } = useCourseDetail(courseId);
  const addChapter = useAddChapter(courseId);
  const addLesson = useAddLesson(courseId);
  const addVideo = useAddLessonVideo(courseId);
  const deleteVideo = useDeleteLessonVideo(courseId);
  const uploadVideo = useUploadLessonVideo(courseId);
  const uploadResource = useUploadCourseResource(courseId);
  const grantAccess = useGrantCourseAccess(courseId);
  const { data: studentsData } = useAllTeacherStudents();
  const [chapterTitle, setChapterTitle] = useState('');
  const [lessonTitles, setLessonTitles] = useState<Record<string, string>>({});
  const [videoForms, setVideoForms] = useState<Record<string, { title: string; url: string }>>({});
  const [uploadLessonId, setUploadLessonId] = useState('');
  const [resourceTitle, setResourceTitle] = useState('');
  const [studentId, setStudentId] = useState('');
  const course = data as Course | undefined;
  const chapters = course?.chapters ?? [];
  const students = (Array.isArray(studentsData) ? studentsData : []) as Student[];
  const resourceUrl = (url: string) => url.startsWith('http') ? url : `${API_URL.replace(/\/api\/v1$/, '')}${url}`;

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

  const submitLessonUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && uploadLessonId) uploadVideo.mutate({ lessonId: uploadLessonId, file });
    event.target.value = '';
  };

  const submitResourceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && resourceTitle.trim()) uploadResource.mutate({ file, title: resourceTitle.trim() }, { onSuccess: () => setResourceTitle('') });
    event.target.value = '';
  };

  if (isLoading) return <LoadingState label="Loading course content..." />;
  if (!course) return <EmptyState title="Course not found" />;

  return (
    <div className="space-y-6">
      <div><h1 className="text-xl font-semibold">{course.title}</h1><p className="text-muted-foreground text-sm">Manage lessons, resources, and student access.</p></div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="text-base">Course resources</CardTitle></CardHeader><CardContent className="space-y-3"><Input value={resourceTitle} onChange={(event) => setResourceTitle(event.target.value)} placeholder="Resource title" /><label className="border-input hover:bg-muted inline-flex h-9 w-full cursor-pointer items-center justify-center rounded-md border px-3 text-sm"><Upload className="mr-2 h-4 w-4" />{uploadResource.isPending ? 'Uploading...' : 'Upload image, video, or file'}<input className="sr-only" type="file" accept="image/*,video/*,.pdf,.doc,.docx,.zip" disabled={!resourceTitle.trim() || uploadResource.isPending} onChange={submitResourceUpload} /></label><div className="space-y-2">{(course.resources ?? []).map((resource) => <div key={resource.id} className="flex items-center gap-2 rounded-md border p-2 text-sm"><FileText className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1 truncate">{resource.title}</span>{resource.fileUrl && <a className="text-primary underline" href={resourceUrl(resource.fileUrl)} target="_blank" rel="noreferrer">Open</a>}</div>)}{!(course.resources ?? []).length && <p className="text-muted-foreground text-sm">No resources uploaded yet.</p>}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Free student access</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-muted-foreground text-sm">Choose a student to access this paid course without payment.</p><div className="flex gap-2"><select className="border-input bg-background h-9 min-w-0 flex-1 rounded-md border px-3 text-sm" value={studentId} onChange={(event) => setStudentId(event.target.value)}><option value="">Choose a student</option>{students.map((student) => <option key={student.userId} value={student.userId}>{student.name || student.email} ({student.email})</option>)}</select><Button type="button" disabled={!studentId || grantAccess.isPending} onClick={() => grantAccess.mutate(studentId)}><Gift className="mr-2 h-4 w-4" />Grant</Button></div></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle className="text-base">Add chapter</CardTitle></CardHeader><CardContent><form onSubmit={submitChapter} className="flex gap-2"><Input value={chapterTitle} onChange={(event) => setChapterTitle(event.target.value)} placeholder="Chapter title" /><Button type="submit" disabled={addChapter.isPending}><Plus className="mr-2 h-4 w-4" />Add chapter</Button></form></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Upload lesson video</CardTitle></CardHeader><CardContent className="flex flex-col gap-2 sm:flex-row"><select className="border-input bg-background h-9 rounded-md border px-3 text-sm" value={uploadLessonId} onChange={(event) => setUploadLessonId(event.target.value)}><option value="">Choose a lesson</option>{chapters.flatMap((chapter) => (chapter.lessons ?? []).map((lesson) => <option key={lesson.id} value={lesson.id}>{chapter.title} / {lesson.title}</option>))}</select><label className="border-input hover:bg-muted inline-flex h-9 cursor-pointer items-center justify-center rounded-md border px-3 text-sm"><Video className="mr-2 h-4 w-4" />{uploadVideo.isPending ? 'Uploading...' : 'Choose video'}<input className="sr-only" type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime" disabled={!uploadLessonId || uploadVideo.isPending} onChange={submitLessonUpload} /></label></CardContent></Card>
      {chapters.length === 0 ? <EmptyState title="No chapters yet" description="Add a chapter to start building this course." /> : chapters.map((chapter) => <Card key={chapter.id}><CardHeader><CardTitle className="text-base">{chapter.title}</CardTitle></CardHeader><CardContent className="space-y-4"><form onSubmit={(event) => submitLesson(event, chapter.id)} className="flex gap-2"><Input value={lessonTitles[chapter.id] ?? ''} onChange={(event) => setLessonTitles({ ...lessonTitles, [chapter.id]: event.target.value })} placeholder="Lesson title" /><Button type="submit" variant="outline" disabled={addLesson.isPending}><Plus className="mr-2 h-4 w-4" />Add lesson</Button></form>{(chapter.lessons ?? []).map((lesson) => { const form = videoForms[lesson.id] ?? { title: '', url: '' }; return <div key={lesson.id} className="rounded-md border p-3"><div className="flex items-center justify-between gap-3"><div><p className="font-medium">{lesson.title}</p><p className="text-muted-foreground text-xs">{lesson.videos?.length ?? 0} video(s)</p></div><Badge variant="secondary">Lesson</Badge></div><div className="mt-3 space-y-2">{(lesson.videos ?? []).map((video) => <div key={video.id} className="flex items-center gap-2 text-sm"><Video className="text-primary h-4 w-4" /><a className="min-w-0 flex-1 truncate underline" href={video.url} target="_blank" rel="noreferrer">{video.title || video.url}</a><Button type="button" variant="ghost" size="icon" aria-label="Delete video" onClick={() => { if (window.confirm('Delete this video?')) deleteVideo.mutate(video.id); }}><Trash2 className="text-destructive h-4 w-4" /></Button></div>)}<form onSubmit={(event) => submitVideo(event, lesson.id)} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]"><Input value={form.title} onChange={(event) => setVideoForms({ ...videoForms, [lesson.id]: { ...form, title: event.target.value } })} placeholder="Video title" /><Input type="url" required value={form.url} onChange={(event) => setVideoForms({ ...videoForms, [lesson.id]: { ...form, url: event.target.value } })} placeholder="Video URL" /><Button type="submit" variant="outline" disabled={addVideo.isPending}><Plus className="h-4 w-4" /></Button></form></div></div>; })}</CardContent></Card>)}
    </div>
  );
}
