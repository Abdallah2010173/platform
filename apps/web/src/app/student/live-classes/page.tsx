'use client';

import { Video, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStudentUpcomingMeetings, useStudentAttendance } from '@/lib/api/hooks';
import { LoadingState, EmptyState } from '@/components/dashboard/data-states';

interface MeetingItem {
  id: string;
  topic?: string;
  title?: string;
  startTime?: string | null;
  start?: string | null;
  durationMinutes?: number;
  joinUrl?: string;
  status?: string;
  [key: string]: unknown;
}

export default function StudentLiveClassesPage() {
  const { data: meetings, isLoading } = useStudentUpcomingMeetings();
  const { data: attendance, isLoading: attendanceLoading } = useStudentAttendance();

  const upcoming: MeetingItem[] = Array.isArray(meetings)
    ? (meetings as MeetingItem[])
    : ((meetings as { items?: MeetingItem[] })?.items ?? []);

  const attendanceList = Array.isArray(attendance)
    ? (attendance as MeetingItem[])
    : ((attendance as { items?: MeetingItem[] })?.items ?? []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Live Classes</h2>
        <p className="text-muted-foreground text-sm">
          Upcoming live sessions you&apos;re enrolled in
        </p>
      </div>

      <section className="space-y-3">
        <h3 className="text-muted-foreground text-sm font-medium">Upcoming</h3>
        {isLoading ? (
          <LoadingState />
        ) : upcoming.length === 0 ? (
          <EmptyState title="No upcoming live classes" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((m) => (
              <Card key={m.id}>
                <CardHeader>
                  <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                    <Video className="text-primary h-5 w-5" />
                  </div>
                  <CardTitle className="mt-3 text-base">
                    {String(m.topic ?? m.title ?? '')}
                  </CardTitle>
                  <CardDescription>
                    {new Date(String(m.startTime ?? m.start ?? '')).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild size="sm" className="w-full">
                    <a href={String(m.joinUrl ?? '#')} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" /> Join Class
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-muted-foreground text-sm font-medium">Attendance History</h3>
        {attendanceLoading ? (
          <LoadingState />
        ) : attendanceList.length === 0 ? (
          <EmptyState title="No attendance records" />
        ) : (
          <Card>
            <CardContent className="divide-y">
              {attendanceList.map((a, i) => (
                <div key={(a.id as string) ?? i} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{String(a.topic ?? a.title ?? '')}</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(String(a.joinedAt ?? a.startTime ?? '')).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={String(a.status ?? '') === 'PRESENT' ? 'default' : 'secondary'}>
                    {String(a.status ?? '')}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
