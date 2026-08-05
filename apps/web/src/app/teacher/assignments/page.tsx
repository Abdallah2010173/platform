'use client';

import { ClipboardList, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTeacherAssignments } from '@/lib/api/hooks';
import { LoadingState, EmptyState } from '@/components/dashboard/data-states';

interface AssignmentItem {
  id: string;
  title: string;
  type?: string;
  dueDate?: string | null;
  isPublished?: boolean;
  submissions?: { _count?: number } | number;
  [key: string]: unknown;
}

export default function TeacherAssignmentsPage() {
  const { data, isLoading } = useTeacherAssignments();

  const assignments = Array.isArray(data)
    ? (data as AssignmentItem[])
    : ((data as { items?: AssignmentItem[] })?.items ?? []);

  if (isLoading) return <LoadingState label="Loading assignments..." />;

  if (assignments.length === 0) {
    return (
      <EmptyState title="No assignments" description="Assignments you create will appear here." />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {assignments.map((a) => (
        <Card key={a.id}>
          <CardHeader className="flex flex-row items-start justify-between">
            <CardTitle className="text-base">{a.title}</CardTitle>
            <Badge variant={a.isPublished ? 'default' : 'secondary'}>
              {a.isPublished ? 'Published' : 'Draft'}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-muted-foreground flex items-center gap-1 text-sm">
              <ClipboardList className="h-4 w-4" />
              {String(a.type ?? 'HOMEWORK')}
            </p>
            {a.dueDate && (
              <p className="text-muted-foreground flex items-center gap-1 text-sm">
                <CalendarDays className="h-4 w-4" />
                Due {new Date(String(a.dueDate)).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
