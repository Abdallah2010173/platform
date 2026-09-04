'use client';

import { FormEvent, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { FileImage, FileText, Gift, Pencil, Plus, Save, Trash2, Upload, Video, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmptyState, LoadingState } from '@/components/dashboard/data-states';
import { API_URL } from '@/lib/api/client';
import {
  useAddChapter,
  useAddLesson,
  useAddLessonVideo,
  useAllTeacherStudents,
  useCourseDetail,
  useDeleteCourseResource,
  useDeleteLessonVideo,
  useGrantCourseAccess,
  useRevokeCourseAccess,
  useUploadCourseResource,
  useUploadLessonVideo,
  useUpdateCourseResource,
} from '@/lib/api/hooks';

interface VideoItem { id: string; title?: string; url?: string }
interface Lesson { id: string; title: string; videos?: VideoItem[] }
interface Chapter { id: string; title: string; lessons?: Lesson[] }
interface Resource { id: string; title: string; type?: string | null; mimeType?: string | null; fileUrl?: string | null }
interface Student { userId: string; name?: string; email: string; avatarUrl?: string | null; enrolledCourses?: { id: string; accessType?: string; status?: string }[] }
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
  const updateResource = useUpdateCourseResource(courseId);
  const deleteResource = useDeleteCourseResource(courseId);
  const grantAccess = useGrantCourseAccess(courseId);
  const revokeAccess = useRevokeCourseAccess(courseId);
  const { data: studentsData } = useAllTeacherStudents();
  const [chapterTitle, setChapterTitle] = useState('');
  const [lessonTitles, setLessonTitles] = useState<Record<string, string>>({});
  const [videoForms, setVideoForms] = useState<Record<string, { title: string; url: string }>>({});
  const [uploadLessonId, setUploadLessonId] = useState('');
  const [resourceTitle, setResourceTitle] = useState('');
  const [imageTitle, setImageTitle] = useState('');
  const [editingResource, setEditingResource] = useState<{ id: string; title: string } | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const resourceInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const course = data as Course | undefined;
  const chapters = course?.chapters ?? [];
  const resources = course?.resources ?? [];
  const imageResources = resources.filter((resource) => resource.type === 'IMAGE' || resource.mimeType?.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(resource.fileUrl ?? resource.title));
  const fileResources = resources.filter((resource) => !imageResources.includes(resource));
  const students = (Array.isArray(studentsData) ? studentsData : []) as Student[];
  const visibleStudents = students.filter((student) => {
    const query = studentSearch.trim().toLowerCase();
    return !query || `${student.name ?? ''} ${student.email}`.toLowerCase().includes(query);
  });
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
    if (file) uploadResource.mutate({ file, title: resourceTitle.trim() || file.name.replace(/\.[^/.]+$/, '') }, { onSuccess: () => setResourceTitle('') });
    event.target.value = '';
  };

  const submitImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) uploadResource.mutate({ file, title: imageTitle.trim() || file.name.replace(/\.[^/.]+$/, '') }, { onSuccess: () => setImageTitle('') });
    event.target.value = '';
  };

  const uploadButtonLabel = uploadResource.isPending ? 'Uploading...' : 'Choose file from device';

  const saveResourceTitle = () => {
    if (!editingResource?.title.trim()) return;
    updateResource.mutate({ id: editingResource.id, data: { title: editingResource.title.trim() } }, { onSuccess: () => setEditingResource(null) });
  };

  const renderResource = (resource: Resource, isImage: boolean) => {
    const editing = editingResource?.id === resource.id;
    return <div key={resource.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
      {isImage ? <FileImage className="text-primary h-4 w-4 shrink-0" /> : <FileText className="h-4 w-4 shrink-0" />}
      {editing ? <Input autoFocus value={editingResource.title} onChange={(event) => setEditingResource({ ...editingResource, title: event.target.value })} onKeyDown={(event) => { if (event.key === 'Enter') saveResourceTitle(); if (event.key === 'Escape') setEditingResource(null); }} className="h-8 min-w-0 flex-1" /> : <span className="min-w-0 flex-1 truncate">{resource.title}</span>}
      {!editing && resource.fileUrl && <a className="text-primary underline" href={resourceUrl(resource.fileUrl)} target="_blank" rel="noreferrer">Open</a>}
      {editing ? <><Button type="button" variant="ghost" size="icon" aria-label="Save resource title" disabled={updateResource.isPending} onClick={saveResourceTitle}><Save className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" aria-label="Cancel editing resource" onClick={() => setEditingResource(null)}><X className="h-4 w-4" /></Button></> : <><Button type="button" variant="ghost" size="icon" aria-label={`Edit ${resource.title}`} onClick={() => setEditingResource({ id: resource.id, title: resource.title })}><Pencil className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" aria-label={`Delete ${resource.title}`} disabled={deleteResource.isPending} onClick={() => { if (window.confirm(`Delete resource "${resource.title}"?`)) deleteResource.mutate(resource.id); }}><Trash2 className="text-destructive h-4 w-4" /></Button></>}
    </div>;
  };

  if (isLoading) return <LoadingState label="Loading course content..." />;
  if (!course) return <EmptyState title="Course not found" />;

  return (
    <div className="space-y-6">
      <div><h1 className="text-xl font-semibold">{course.title}</h1><p className="text-muted-foreground text-sm">Manage lessons, resources, and student access.</p></div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardHeader><CardTitle className="text-base">Files and resources</CardTitle></CardHeader><CardContent className="space-y-3"><Input value={resourceTitle} onChange={(event) => setResourceTitle(event.target.value)} placeholder="Resource title (optional)" /><input ref={resourceInputRef} className="sr-only" type="file" accept="video/*,.pdf,.doc,.docx,.zip" disabled={uploadResource.isPending} onChange={submitResourceUpload} /><Button type="button" variant="outline" className="w-full" disabled={uploadResource.isPending} onClick={() => resourceInputRef.current?.click()}><Upload className="mr-2 h-4 w-4" />{uploadButtonLabel}</Button><div className="space-y-2">{fileResources.map((resource) => renderResource(resource, false))}{!fileResources.length && <p className="text-muted-foreground text-sm">No files uploaded yet.</p>}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Images</CardTitle></CardHeader><CardContent className="space-y-3"><Input value={imageTitle} onChange={(event) => setImageTitle(event.target.value)} placeholder="Image title (optional)" /><input ref={imageInputRef} className="sr-only" type="file" accept="image/*" disabled={uploadResource.isPending} onChange={submitImageUpload} /><Button type="button" variant="outline" className="w-full" disabled={uploadResource.isPending} onClick={() => imageInputRef.current?.click()}><FileImage className="mr-2 h-4 w-4" />{uploadResource.isPending ? 'Uploading...' : 'Choose image'}</Button><div className="space-y-2">{imageResources.map((resource) => renderResource(resource, true))}{!imageResources.length && <p className="text-muted-foreground text-sm">No images uploaded yet.</p>}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Lesson videos</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-muted-foreground text-sm">Choose a lesson, then upload its video.</p><select className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm" value={uploadLessonId} onChange={(event) => setUploadLessonId(event.target.value)}><option value="">Choose a lesson</option>{chapters.flatMap((chapter) => (chapter.lessons ?? []).map((lesson) => <option key={lesson.id} value={lesson.id}>{chapter.title} / {lesson.title}</option>))}</select><label className="border-input hover:bg-muted inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-md border px-3 text-sm"><Video className="mr-2 h-4 w-4" />{uploadVideo.isPending ? 'Uploading...' : 'Choose video'}<input className="sr-only" type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime" disabled={!uploadLessonId || uploadVideo.isPending} onChange={submitLessonUpload} /></label></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Free student access</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-muted-foreground text-sm">All platform students are shown here. Choose one to access this paid course without payment.</p><Input value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} placeholder="Search students by name or email" /><div className="max-h-64 space-y-2 overflow-y-auto pr-1">{visibleStudents.map((student) => { const enrollment = student.enrolledCourses?.find((item) => item.id === courseId); const hasGift = enrollment?.status === 'ACTIVE' && (enrollment.accessType === 'TEACHER_GRANTED' || enrollment.accessType === 'ADMIN_GRANTED'); return <div key={student.userId} className="flex items-center gap-3 rounded-md border p-2"><Avatar className="h-8 w-8"><AvatarImage src={student.avatarUrl ?? ''} alt={student.name ?? student.email} /><AvatarFallback>{(student.name ?? student.email).slice(0, 1).toUpperCase()}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{student.name || 'Unnamed student'}</p><p className="text-muted-foreground truncate text-xs">{student.email}</p></div>{hasGift ? <Button type="button" size="sm" variant="outline" disabled={revokeAccess.isPending} onClick={() => revokeAccess.mutate(student.userId)}><Gift className="mr-1.5 h-4 w-4" />Cancel gift</Button> : <Button type="button" size="sm" disabled={grantAccess.isPending} onClick={() => grantAccess.mutate(student.userId)}><Gift className="mr-1.5 h-4 w-4" />Free access</Button>}</div>; })}{visibleStudents.length === 0 && <p className="text-muted-foreground py-4 text-center text-sm">No platform students found.</p>}</div></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle className="text-base">Add chapter</CardTitle></CardHeader><CardContent><form onSubmit={submitChapter} className="flex gap-2"><Input value={chapterTitle} onChange={(event) => setChapterTitle(event.target.value)} placeholder="Chapter title" /><Button type="submit" disabled={addChapter.isPending}><Plus className="mr-2 h-4 w-4" />Add chapter</Button></form></CardContent></Card>
      {chapters.length === 0 ? <EmptyState title="No chapters yet" description="Add a chapter to start building this course." /> : chapters.map((chapter) => <Card key={chapter.id}><CardHeader><CardTitle className="text-base">{chapter.title}</CardTitle></CardHeader><CardContent className="space-y-4"><form onSubmit={(event) => submitLesson(event, chapter.id)} className="flex gap-2"><Input value={lessonTitles[chapter.id] ?? ''} onChange={(event) => setLessonTitles({ ...lessonTitles, [chapter.id]: event.target.value })} placeholder="Lesson title" /><Button type="submit" variant="outline" disabled={addLesson.isPending}><Plus className="mr-2 h-4 w-4" />Add lesson</Button></form>{(chapter.lessons ?? []).map((lesson) => { const form = videoForms[lesson.id] ?? { title: '', url: '' }; return <div key={lesson.id} className="rounded-md border p-3"><div className="flex items-center justify-between gap-3"><div><p className="font-medium">{lesson.title}</p><p className="text-muted-foreground text-xs">{lesson.videos?.length ?? 0} video(s)</p></div><Badge variant="secondary">Lesson</Badge></div><div className="mt-3 space-y-2">{(lesson.videos ?? []).map((video) => <div key={video.id} className="flex items-center gap-2 text-sm"><Video className="text-primary h-4 w-4" /><a className="min-w-0 flex-1 truncate underline" href={video.url} target="_blank" rel="noreferrer">{video.title || video.url}</a><Button type="button" variant="ghost" size="icon" aria-label="Delete video" onClick={() => { if (window.confirm('Delete this video?')) deleteVideo.mutate(video.id); }}><Trash2 className="text-destructive h-4 w-4" /></Button></div>)}<form onSubmit={(event) => submitVideo(event, lesson.id)} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]"><Input value={form.title} onChange={(event) => setVideoForms({ ...videoForms, [lesson.id]: { ...form, title: event.target.value } })} placeholder="Video title" /><Input type="url" required value={form.url} onChange={(event) => setVideoForms({ ...videoForms, [lesson.id]: { ...form, url: event.target.value } })} placeholder="Video URL" /><Button type="submit" variant="outline" disabled={addVideo.isPending}><Plus className="h-4 w-4" /></Button></form></div></div>; })}</CardContent></Card>)}
    </div>
  );
}
