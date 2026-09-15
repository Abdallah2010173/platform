'use client';

import { FormEvent, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Copy,
  Gift,
  Pencil,
  Plus,
  Trash2,
  Video,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState, LoadingState } from '@/components/dashboard/data-states';
import { R2FileUpload } from '@/components/r2-file-upload';
import { LessonVideoUpload } from '@/components/lesson-video-upload';
import {
  useAddCourseLesson,
  useAddLessonContentBlock,
  useAllTeacherStudents,
  useCourseDetail,
  useDeleteLessonVideo,
  useDeleteLesson,
  useDeleteLessonContentBlock,
  useGrantCourseAccess,
  useCreateCourseAccessCode,
  useRevokeCourseAccess,
  useUpdateLessonContentBlock,
  useReorderLessonContentBlocks,
} from '@/lib/api/hooks';

interface VideoItem {
  id: string;
  title?: string;
  url?: string;
  transcodingStatus?: string | null;
  processingError?: string | null;
}
interface Lesson {
  id: string;
  title: string;
  videos?: VideoItem[];
  contentBlocks?: ContentBlock[];
}
interface ContentBlock {
  id: string;
  type: string;
  title?: string | null;
  orderIndex: number;
  data: { text?: string; url?: string; videoId?: string };
}
interface Chapter {
  id: string;
  title: string;
  lessons?: Lesson[];
}
interface Student {
  userId: string;
  name?: string;
  email: string;
  avatarUrl?: string | null;
  enrolledCourses?: { id?: string; courseId?: string; accessType?: string; status?: string }[];
}
interface Course {
  id: string;
  title: string;
  chapters?: Chapter[];
}

export default function TeacherCourseContentPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;
  const { data, isLoading } = useCourseDetail(courseId);
  const addLesson = useAddCourseLesson(courseId);
  const addContentBlock = useAddLessonContentBlock(courseId);
  const deleteVideo = useDeleteLessonVideo(courseId);
  const deleteLesson = useDeleteLesson(courseId);
  const deleteContentBlock = useDeleteLessonContentBlock(courseId);
  const updateContentBlock = useUpdateLessonContentBlock(courseId);
  const reorderContentBlocks = useReorderLessonContentBlocks(courseId);
  const grantAccess = useGrantCourseAccess(courseId);
  const createAccessCode = useCreateCourseAccessCode(courseId);
  const revokeAccess = useRevokeCourseAccess(courseId);
  const { data: studentsData } = useAllTeacherStudents();
  const [lessonTitle, setLessonTitle] = useState('');
  const [contentLessonId, setContentLessonId] = useState('');
  const [contentType, setContentType] = useState('TEXT');
  const [contentTitle, setContentTitle] = useState('');
  const [contentValue, setContentValue] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [maxCodeUses, setMaxCodeUses] = useState('1');
  const [codeExpiresAt, setCodeExpiresAt] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const [videoToDelete, setVideoToDelete] = useState<VideoItem | null>(null);
  const course = data as Course | undefined;
  const chapters = course?.chapters ?? [];
  const lessons = chapters.flatMap((chapter) => chapter.lessons ?? []);
  const students = (Array.isArray(studentsData) ? studentsData : []) as Student[];
  const visibleStudents = students.filter((student) => {
    const query = studentSearch.trim().toLowerCase();
    return !query || `${student.name ?? ''} ${student.email}`.toLowerCase().includes(query);
  });
  const createAccessCodeForCourse = () => {
    createAccessCode.mutate(
      {
        maxUses: Number(maxCodeUses) || 1,
        ...(codeExpiresAt ? { expiresAt: new Date(codeExpiresAt).toISOString() } : {}),
      },
      { onSuccess: (result) => setCreatedCode((result as { code: string }).code) },
    );
  };

  const accessCodePanel = (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Course access code</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground text-sm">
          Create a code and send it to a student to unlock this course.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            type="number"
            min="1"
            max="1000"
            value={maxCodeUses}
            onChange={(event) => setMaxCodeUses(event.target.value)}
            placeholder="Maximum uses"
          />
          <Input
            type="datetime-local"
            value={codeExpiresAt}
            onChange={(event) => setCodeExpiresAt(event.target.value)}
          />
        </div>
        <Button
          type="button"
          className="w-full"
          disabled={createAccessCode.isPending}
          onClick={createAccessCodeForCourse}
        >
          Create access code
        </Button>
        {createdCode && (
          <div className="bg-muted/40 flex items-center gap-2 rounded-md border p-3">
            <code className="flex-1 text-lg font-semibold tracking-widest">{createdCode}</code>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Copy access code"
              onClick={() => void navigator.clipboard.writeText(createdCode)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const submitLesson = (event: FormEvent) => {
    event.preventDefault();
    const title = lessonTitle.trim();
    if (!title) return;
    addLesson.mutate({ title }, { onSuccess: () => setLessonTitle('') });
  };

  const submitSelectedContentBlock = (event: FormEvent) => {
    event.preventDefault();
    if (!contentLessonId || !contentValue.trim()) return;
    const data = contentType === 'TEXT' ? { text: contentValue.trim() } : { url: contentValue.trim() };
    addContentBlock.mutate(
      { lessonId: contentLessonId, data: { type: contentType, title: contentTitle.trim() || undefined, data } },
      { onSuccess: () => { setContentTitle(''); setContentValue(''); } },
    );
  };

  const addUploadedContentBlock = (uploaded: { fileKey: string; publicUrl?: string; fileName: string; contentType: string }) => {
    if (!contentLessonId) return;
    addContentBlock.mutate({
      lessonId: contentLessonId,
      data: {
        type: contentType,
        title: contentTitle.trim() || uploaded.fileName,
        data: { url: uploaded.publicUrl ?? uploaded.fileKey, fileName: uploaded.fileName, mimeType: uploaded.contentType },
      },
    }, { onSuccess: () => { setContentTitle(''); setContentValue(''); } });
  };

  const addUploadedVideoBlock = (uploaded: { id: string }) => {
    if (!contentLessonId) return;
    addContentBlock.mutate({
      lessonId: contentLessonId,
      data: { type: 'VIDEO', title: contentTitle.trim() || 'Lesson video', data: { videoId: uploaded.id } },
    }, { onSuccess: () => setContentTitle('') });
  };

  const editContentBlock = (lessonId: string, block: ContentBlock) => {
    const value = block.type === 'TEXT' ? block.data.text : block.data.url;
    const nextValue = window.prompt('Content value', value ?? '');
    if (nextValue === null || !nextValue.trim()) return;
    const data = block.type === 'TEXT' ? { text: nextValue.trim() } : { url: nextValue.trim() };
    updateContentBlock.mutate({ id: block.id, data: { data } });
  };

  const moveContentBlock = (lessonId: string, blocks: ContentBlock[], index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= blocks.length) return;
    const next = [...blocks];
    const currentBlock = next[index];
    const targetBlock = next[nextIndex];
    if (!currentBlock || !targetBlock) return;
    next[index] = targetBlock;
    next[nextIndex] = currentBlock;
    reorderContentBlocks.mutate({ lessonId, blockIds: next.map((block) => block.id) });
  };

  const confirmDeleteVideo = () => {
    if (!videoToDelete) return;
    deleteVideo.mutate(videoToDelete.id, { onSuccess: () => setVideoToDelete(null) });
  };

  if (isLoading) return <LoadingState label="Loading course content..." />;
  if (!course) return <EmptyState title="Course not found" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{course.title}</h1>
        <p className="text-muted-foreground text-sm">
          Manage lessons, resources, and student access.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {accessCodePanel}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Free student access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              All platform students are shown here. Choose one to access this paid course without
              payment.
            </p>
            <Input
              value={studentSearch}
              onChange={(event) => setStudentSearch(event.target.value)}
              placeholder="Search students by name or email"
            />
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {visibleStudents.map((student) => {
                const enrollment = student.enrolledCourses?.find(
                  (item) => (item.courseId ?? item.id) === courseId,
                );
                const hasGift =
                  enrollment?.status === 'ACTIVE' &&
                  (enrollment.accessType === 'TEACHER_GRANTED' ||
                    enrollment.accessType === 'ADMIN_GRANTED');
                return (
                  <div
                    key={student.userId}
                    className="flex items-center gap-3 rounded-md border p-2"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={student.avatarUrl ?? ''}
                        alt={student.name ?? student.email}
                      />
                      <AvatarFallback>
                        {(student.name ?? student.email).slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {student.name || 'Unnamed student'}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">{student.email}</p>
                    </div>
                    {hasGift ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={revokeAccess.isPending}
                        onClick={() => revokeAccess.mutate(student.userId)}
                      >
                        <Gift className="mr-1.5 h-4 w-4" />
                        Cancel gift
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        disabled={grantAccess.isPending}
                        onClick={() => grantAccess.mutate(student.userId)}
                      >
                        <Gift className="mr-1.5 h-4 w-4" />
                        Free access
                      </Button>
                    )}
                  </div>
                );
              })}
              {visibleStudents.length === 0 && (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  No platform students found.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add lesson to this course</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitLesson} className="flex gap-2">
            <Input value={lessonTitle} onChange={(event) => setLessonTitle(event.target.value)} placeholder="Lesson title" />
            <Button type="submit" disabled={addLesson.isPending}><Plus className="mr-2 h-4 w-4" />Add lesson</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Add content to a lesson</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submitSelectedContentBlock} className="space-y-3">
            <select className="border-input bg-background h-10 rounded-md border px-3 text-sm" value={contentLessonId} onChange={(event) => setContentLessonId(event.target.value)}>
              <option value="">Choose a lesson</option>
              {lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}
            </select>
            <div className="flex flex-wrap gap-2">
              {['TEXT', 'IMAGE', 'VIDEO', 'PDF', 'FILE', 'EMBED'].map((type) => <Button key={type} type="button" size="sm" variant={contentType === type ? 'default' : 'outline'} onClick={() => setContentType(type)}>{type}</Button>)}
            </div>
            <Input value={contentTitle} onChange={(event) => setContentTitle(event.target.value)} placeholder="Content title" />
            {contentType === 'TEXT' || contentType === 'EMBED' ? (
              <div className="grid gap-2 md:grid-cols-[1fr_auto]"><Input value={contentValue} onChange={(event) => setContentValue(event.target.value)} placeholder={contentType === 'TEXT' ? 'Explanation text' : 'Embed URL'} /><Button type="submit" disabled={!contentLessonId || !contentValue.trim() || addContentBlock.isPending}><Plus className="mr-2 h-4 w-4" />Add</Button></div>
            ) : contentType === 'VIDEO' ? (
              contentLessonId ? <LessonVideoUpload lessonId={contentLessonId} label="Upload video from device" onUploaded={addUploadedVideoBlock} /> : <p className="text-muted-foreground text-sm">Choose a lesson first.</p>
            ) : (
              contentLessonId ? <R2FileUpload accept={contentType === 'IMAGE' ? 'image/png,image/jpeg,image/webp,image/gif' : contentType === 'PDF' ? 'application/pdf' : 'application/pdf,application/zip,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain'} resourceType={contentType === 'IMAGE' ? 'IMAGE' : 'FILE'} label="Upload from device" onUploaded={addUploadedContentBlock} disabled={addContentBlock.isPending} /> : <p className="text-muted-foreground text-sm">Choose a lesson first.</p>
            )}
          </form>
        </CardContent>
      </Card>
      {lessons.length === 0 ? (
        <EmptyState
          title="No lessons yet"
          description="Add a lesson to start building this course."
        />
      ) : (
        <Card>
            <CardHeader>
              <CardTitle className="text-base">Lessons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lessons.map((lesson) => {
                const blocks = [...(lesson.contentBlocks ?? [])].sort((a, b) => a.orderIndex - b.orderIndex);
                return (
                  <div key={lesson.id} className="rounded-md border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{lesson.title}</p>
                        <p className="text-muted-foreground text-xs">
                          {blocks.length} content block(s) · {lesson.videos?.length ?? 0} legacy video(s)
                        </p>
                      </div>
                      <div className="flex items-center gap-2"><Badge variant="secondary">Lesson</Badge><Button type="button" variant="ghost" size="icon" aria-label={`Delete lesson ${lesson.title}`} disabled={deleteLesson.isPending} onClick={() => { if (window.confirm(`Delete lesson "${lesson.title}"?`)) deleteLesson.mutate(lesson.id); }}><Trash2 className="text-destructive h-4 w-4" /></Button></div>
                    </div>
                    <div className="mt-4 space-y-2 rounded-md bg-muted/30 p-3">
                      <p className="text-sm font-medium">Lesson content</p>
                      {blocks.map((block, index) => (
                        <div key={block.id} className="flex items-center gap-2 rounded-md border bg-background p-2 text-sm">
                          <Badge variant="outline">{block.type}</Badge>
                          <span className="min-w-0 flex-1 truncate">{block.title || (block.type === 'TEXT' ? block.data.text : block.data.url) || 'Untitled block'}</span>
                          <Button type="button" variant="ghost" size="icon" aria-label="Move block up" disabled={index === 0 || reorderContentBlocks.isPending} onClick={() => moveContentBlock(lesson.id, blocks, index, -1)}>↑</Button>
                          <Button type="button" variant="ghost" size="icon" aria-label="Move block down" disabled={index === blocks.length - 1 || reorderContentBlocks.isPending} onClick={() => moveContentBlock(lesson.id, blocks, index, 1)}>↓</Button>
                          <Button type="button" variant="ghost" size="icon" aria-label="Edit content block" onClick={() => editContentBlock(lesson.id, block)}><Pencil className="h-4 w-4" /></Button>
                          <Button type="button" variant="ghost" size="icon" aria-label="Delete content block" disabled={deleteContentBlock.isPending} onClick={() => deleteContentBlock.mutate(block.id)}><Trash2 className="text-destructive h-4 w-4" /></Button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 space-y-2">
                      {(lesson.videos ?? []).map((video) => (
                        <div key={video.id} className="flex items-center gap-2 text-sm">
                          <Video className="text-primary h-4 w-4" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{video.title || 'Lesson video'}</p>
                            <p className="text-muted-foreground text-xs">
                              {video.transcodingStatus === 'READY'
                                ? 'Ready for students'
                                : video.transcodingStatus === 'FAILED'
                                  ? `Processing failed: ${video.processingError || 'check server logs'}`
                                  : 'Processing video...'}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Delete video"
                            onClick={() => setVideoToDelete(video)}
                          >
                            <Trash2 className="text-destructive h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
      )}
      <Dialog open={Boolean(videoToDelete)} onOpenChange={(open) => !open && setVideoToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete video?</DialogTitle>
            <DialogDescription>
              This permanently deletes the original video and all processed HLS files from storage.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setVideoToDelete(null)} disabled={deleteVideo.isPending}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDeleteVideo} disabled={deleteVideo.isPending}>
              {deleteVideo.isPending ? 'Deleting...' : 'Delete permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
