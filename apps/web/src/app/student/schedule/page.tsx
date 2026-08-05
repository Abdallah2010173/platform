'use client';

import { CalendarDays } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStudentCalendar } from '@/lib/api/hooks';
import { LoadingState, EmptyState } from '@/components/dashboard/data-states';

interface EventItem {
  id: string;
  title: string;
  startTime?: string | null;
  endTime?: string | null;
  type?: string;
  [key: string]: unknown;
}

export default function StudentSchedulePage() {
  const { data, isLoading, isError } = useStudentCalendar();

  const events: EventItem[] = Array.isArray(data)
    ? (data as EventItem[])
    : ((data as { events?: EventItem[] })?.events ?? []);

  const sorted = [...events].sort((a, b) =>
    String(a.startTime ?? '').localeCompare(String(b.startTime ?? '')),
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">My Schedule</h2>
        <p className="text-muted-foreground text-sm">Upcoming classes, exams and meetings</p>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : isError || sorted.length === 0 ? (
        <EmptyState title="No upcoming events" />
      ) : (
        <Card>
          <CardContent className="divide-y">
            {sorted.map((ev) => (
              <div key={ev.id as string} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-lg">
                    <CalendarDays className="text-primary h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{String(ev.title)}</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(String(ev.startTime ?? '')).toLocaleString()}
                    </p>
                  </div>
                </div>
                {ev.type && <Badge variant="secondary">{String(ev.type)}</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
