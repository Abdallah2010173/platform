'use client';

import { Video } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTeacherMeetings } from '@/lib/api/hooks';
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

  const meetings = Array.isArray(data)
    ? (data as MeetingItem[])
    : ((data as { items?: MeetingItem[] })?.items ?? []);

  if (isLoading) return <LoadingState label="Loading live classes..." />;

  if (meetings.length === 0) {
    return (
      <EmptyState title="No live classes" description="Your scheduled meetings will appear here." />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
