'use client';

import { FormEvent, useState } from 'react';
import { Video, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateMeeting, useDeleteMeeting, useTeacherMeetings } from '@/lib/api/hooks';
import { LoadingState, EmptyState } from '@/components/dashboard/data-states';

interface MeetingItem {
  id: string;
  topic?: string;
  title?: string;
  startTime?: string | null;
  status?: string;
  joinUrl?: string | null;
  [key: string]: unknown;
}

export default function TeacherLiveClassesPage() {
  const { data, isLoading } = useTeacherMeetings();
  const createMeeting = useCreateMeeting();
  const deleteMeeting = useDeleteMeeting();
  const [topic, setTopic] = useState('');
  const [startTime, setStartTime] = useState('');
  const [joinUrl, setJoinUrl] = useState('');

  const meetings = Array.isArray(data)
    ? (data as MeetingItem[])
    : ((data as { items?: MeetingItem[] })?.items ?? []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!topic.trim() || !startTime) return;
    createMeeting.mutate({ topic: topic.trim(), startTime: new Date(startTime).toISOString(), joinUrl: joinUrl.trim() || undefined }, {
      onSuccess: () => { setTopic(''); setStartTime(''); setJoinUrl(''); },
    });
  };

  if (isLoading) return <LoadingState label="Loading live classes..." />;

  return (
    <div className="space-y-4">
      <Card><CardHeader><CardTitle className="text-base">Schedule a live class</CardTitle></CardHeader><CardContent><form onSubmit={submit} className="grid gap-2 md:grid-cols-[1fr_1fr_1.5fr_auto]"><Input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Class title" required /><Input type="datetime-local" value={startTime} onChange={(event) => setStartTime(event.target.value)} required /><Input type="url" value={joinUrl} onChange={(event) => setJoinUrl(event.target.value)} placeholder="Zoom link (optional)" /><Button type="submit" disabled={createMeeting.isPending}><Plus className="mr-2 h-4 w-4" />Schedule</Button></form></CardContent></Card>
      {meetings.length === 0 ? <Card><CardContent><EmptyState title="No live classes" description="Schedule your first class above and students in the related course will see it." /></CardContent></Card> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {meetings.map((m) => (
        <Card key={m.id}>
          <CardHeader className="flex flex-row items-start justify-between">
            <CardTitle className="text-base">{String(m.topic ?? m.title ?? '')}</CardTitle>
            <Badge>{String(m.status ?? 'SCHEDULED')}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground flex items-center gap-1 text-sm">
              <Video className="h-4 w-4" />
              {m.startTime ? new Date(String(m.startTime)).toLocaleString() : 'Time TBD'}
            </p>
            {m.joinUrl && (
              <Button asChild size="sm" variant="outline">
                <a href={String(m.joinUrl)} target="_blank" rel="noreferrer">
                  Join Meeting
                </a>
              </Button>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={() => window.confirm('Delete this live class?') && deleteMeeting.mutate(m.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
          </CardContent>
        </Card>
      ))}
      </div>}
    </div>
  );
}
