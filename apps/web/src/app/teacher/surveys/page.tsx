'use client';

import { FormEvent, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EmptyState, LoadingState } from '@/components/dashboard/data-states';
import { useCreateSurvey, useDeleteSurvey, useTeacherCourses, useTeacherSurveys } from '@/lib/api/hooks';

interface CourseOption { id: string; title: string }
interface TeacherSurvey { id: string; title: string; isPublished: boolean; course?: { title: string } }

function isListOf<T extends object>(value: unknown, isItem: (item: unknown) => item is T): value is T[] {
  return Array.isArray(value) && value.every(isItem);
}
const isCourseOption = (value: unknown): value is CourseOption => typeof value === 'object' && value !== null && 'id' in value && 'title' in value;
const isTeacherSurvey = (value: unknown): value is TeacherSurvey => typeof value === 'object' && value !== null && 'id' in value && 'title' in value && 'isPublished' in value;
const isCourseListResponse = (value: unknown): value is { items: CourseOption[] } => typeof value === 'object' && value !== null && 'items' in value && isListOf(value.items, isCourseOption);

export default function TeacherSurveysPage() {
  const [courseId, setCourseId] = useState(''); const [title, setTitle] = useState(''); const [url, setUrl] = useState('');
  const { data, isLoading } = useTeacherSurveys(); const { data: courseData } = useTeacherCourses(); const create = useCreateSurvey(); const remove = useDeleteSurvey();
  const surveys = isListOf(data, isTeacherSurvey) ? data : [];
  const courses = isListOf(courseData, isCourseOption) ? courseData : isCourseListResponse(courseData) ? courseData.items : [];
  const submit = (event: FormEvent) => { event.preventDefault(); if (!courseId || !title.trim() || !url.trim()) return; create.mutate({ courseId, data: { title: title.trim(), externalUrl: url.trim(), isPublished: true } }, { onSuccess: () => { setTitle(''); setUrl(''); } }); };
  return <div className="space-y-5"><Card><CardHeader><CardTitle className="text-base">Create course survey</CardTitle></CardHeader><CardContent><form onSubmit={submit} className="grid gap-2 md:grid-cols-4"><select className="border-input bg-background h-9 rounded-md border px-3 text-sm" value={courseId} onChange={(e) => setCourseId(e.target.value)} required><option value="">Choose course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Survey title" required /><Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://forms.google.com/..." required /><Button disabled={create.isPending}>Create</Button></form></CardContent></Card>{isLoading ? <LoadingState label="Loading surveys..." /> : !surveys.length ? <EmptyState title="No surveys yet" description="Create a survey linked to one of your courses." /> : <div className="grid gap-3">{surveys.map((survey) => <Card key={survey.id}><CardContent className="flex items-center justify-between p-4"><div><p className="font-medium">{survey.title}</p><p className="text-muted-foreground text-sm">{survey.course?.title} · {survey.isPublished ? 'Published' : 'Draft'}</p></div><Button variant="ghost" size="icon" aria-label="Delete survey" onClick={() => window.confirm('Delete this survey?') && remove.mutate(survey.id)}><Trash2 className="text-destructive h-4 w-4" /></Button></CardContent></Card>)}</div>}</div>;
}
