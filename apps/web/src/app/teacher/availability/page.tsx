'use client';

import { Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTeacherAvailability } from '@/lib/api/hooks';
import { LoadingState, EmptyState } from '@/components/dashboard/data-states';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface AvailabilityItem {
  id: string;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  isAvailable?: boolean;
  [key: string]: unknown;
}

export default function TeacherAvailabilityPage() {
  const { data, isLoading } = useTeacherAvailability();

  const slots = Array.isArray(data)
    ? (data as AvailabilityItem[])
    : ((data as { items?: AvailabilityItem[] })?.items ?? []);

  if (isLoading) return <LoadingState label="Loading availability..." />;

  if (slots.length === 0) {
    return (
      <EmptyState
        title="No availability set"
        description="Your available time slots will appear here."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {slots.map((slot) => (
        <Card key={slot.id}>
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-lg">
                <Clock className="text-primary h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {DAY_LABELS[Number(slot.dayOfWeek ?? 0)] ?? 'Unknown'}
                </p>
                <p className="text-muted-foreground text-xs">
                  {String(slot.startTime ?? '')} - {String(slot.endTime ?? '')}
                </p>
              </div>
            </div>
            <Badge variant={slot.isAvailable ? 'success' : 'secondary'}>
              {slot.isAvailable ? 'Available' : 'Unavailable'}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
