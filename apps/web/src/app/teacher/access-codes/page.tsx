'use client';

import { useState } from 'react';
import { Copy, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/dashboard/data-states';
import { useCreateCourseAccessCode, useTeacherCourses } from '@/lib/api/hooks';

interface CourseOption {
  id: string;
  title: string;
}

export default function TeacherAccessCodesPage() {
  const { data, isLoading } = useTeacherCourses();
  const courses = (Array.isArray(data) ? data : (data as { items?: CourseOption[] })?.items ?? []) as CourseOption[];
  const [courseId, setCourseId] = useState('');
  const [maxUses, setMaxUses] = useState('1');
  const [expiresAt, setExpiresAt] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const createCode = useCreateCourseAccessCode(courseId);

  if (isLoading) return <LoadingState label="Loading your courses..." />;

  const create = () => {
    if (!courseId) return;
    createCode.mutate(
      { maxUses: Number(maxUses) || 1, ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}) },
      { onSuccess: (result) => setCreatedCode((result as { code: string }).code) },
    );
  };

  return <div className="mx-auto max-w-2xl space-y-6"><div><h1 className="text-xl font-semibold">Course access codes</h1><p className="text-muted-foreground text-sm">Create a code to send to a student for paid-course access.</p></div><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><KeyRound className="h-4 w-4" />Create access code</CardTitle></CardHeader><CardContent className="space-y-4"><select className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm" value={courseId} onChange={(event) => { setCourseId(event.target.value); setCreatedCode(''); }}><option value="">Choose a course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select><div className="grid gap-3 sm:grid-cols-2"><Input type="number" min="1" max="1000" value={maxUses} onChange={(event) => setMaxUses(event.target.value)} placeholder="Maximum uses" /><Input type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} /></div><Button type="button" className="w-full" disabled={!courseId || createCode.isPending} onClick={create}>Create code</Button>{createdCode && <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-3"><code className="flex-1 text-lg font-semibold tracking-widest">{createdCode}</code><Button type="button" variant="outline" size="icon" aria-label="Copy access code" onClick={() => void navigator.clipboard.writeText(createdCode)}><Copy className="h-4 w-4" /></Button></div>}</CardContent></Card></div>;
}
