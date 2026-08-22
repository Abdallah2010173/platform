'use client';

import { FormEvent, useState } from 'react';
import { Trash2, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoadingState, EmptyState } from '@/components/dashboard/data-states';
import { useAdminMeetings, useAdminUsers, useCreateAdminMeeting, useDeleteAdminMeeting } from '@/lib/api/hooks';

interface Meeting { id: string; topic: string; startTime: string; joinUrl?: string | null; status?: string; teacher?: { user?: { profile?: { displayName?: string | null }; email?: string } }; course?: { title?: string } | null; }
interface User { id: string; role?: string; fullName?: string; email?: string; profile?: { displayName?: string | null } }

export default function AdminMeetingsPage() {
  const meetingsQuery = useAdminMeetings();
  const teachersQuery = useAdminUsers({ role: 'TEACHER', limit: '100' });
  const createMeeting = useCreateAdminMeeting();
  const deleteMeeting = useDeleteAdminMeeting();
  const [form, setForm] = useState({ teacherId: '', topic: '', startTime: '', joinUrl: '' });
  const meetings = (Array.isArray(meetingsQuery.data) ? meetingsQuery.data : []) as Meeting[];
  const teacherData = teachersQuery.data as { items?: User[] } | User[] | undefined;
  const teachers = (Array.isArray(teacherData) ? teacherData : teacherData?.items ?? []).filter((teacher) => teacher.role === 'TEACHER');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.teacherId || !form.topic || !form.startTime || !form.joinUrl) return;
    createMeeting.mutate(form, { onSuccess: () => setForm({ teacherId: '', topic: '', startTime: '', joinUrl: '' }) });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Create online class</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
            <select className="border-input bg-background rounded-md border px-3 text-sm" value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })}>
              <option value="">Select teacher</option>
              {teachers.map((teacher) => <option key={teacher.id} value={(teacher as User & { teacher?: { id: string } }).teacher?.id ?? teacher.id}>{teacher.profile?.displayName ?? teacher.fullName ?? teacher.email}</option>)}
            </select>
            <Input placeholder="Meeting title" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
            <Input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            <Input type="url" placeholder="https://zoom.us/j/..." value={form.joinUrl} onChange={(e) => setForm({ ...form, joinUrl: e.target.value })} />
            <Button type="submit" disabled={createMeeting.isPending} className="md:col-span-2"><Video className="mr-2 h-4 w-4" />Create meeting</Button>
          </form>
        </CardContent>
      </Card>
      {meetingsQuery.isLoading ? <LoadingState /> : meetings.length === 0 ? <EmptyState title="No meetings" description="Created online classes will appear here." /> : <div className="grid gap-4 md:grid-cols-2">{meetings.map((meeting) => <Card key={meeting.id}><CardHeader className="flex flex-row items-start justify-between"><div><CardTitle className="text-base">{meeting.topic}</CardTitle><p className="text-muted-foreground text-sm">{meeting.course?.title ?? 'Platform class'}</p></div><Badge>{meeting.status ?? 'SCHEDULED'}</Badge></CardHeader><CardContent className="flex items-center justify-between gap-3"><div><p className="text-sm">{meeting.teacher?.user?.profile?.displayName ?? meeting.teacher?.user?.email ?? 'Teacher'}</p><p className="text-muted-foreground text-xs">{new Date(meeting.startTime).toLocaleString()}</p></div><Button variant="ghost" size="icon" aria-label="Delete meeting" onClick={() => { if (window.confirm('Are you sure you want to delete this meeting?')) deleteMeeting.mutate(meeting.id); }}><Trash2 className="h-4 w-4" /></Button></CardContent></Card>)}</div>}
    </div>
  );
}
