'use client';

import { ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStudentAssignments } from '@/lib/api/hooks';
import { LoadingState, EmptyState } from '@/components/dashboard/data-states';

interface AssignmentItem {
  id: string;
  title: string;
  courseTitle?: string;
  dueDate?: string | null;
  status?: string;
  type?: string;
  totalMarks?: number | null;
  [key: string]: unknown;
}

export default function StudentAssignmentsPage() {
  const { data, isLoading, isError } = useStudentAssignments();

  const assignments: AssignmentItem[] = Array.isArray(data)
    ? (data as AssignmentItem[])
    : ((data as { items?: AssignmentItem[] })?.items ?? []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">My Assignments</h2>
        <p className="text-muted-foreground text-sm">Homework and assignments for your courses</p>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : isError || assignments.length === 0 ? (
        <EmptyState title="No assignments" description="You have no pending assignments." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assignments.map((a) => (
            <Card key={a.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                    <ClipboardList className="text-primary h-5 w-5" />
                  </div>
                  {a.status && <Badge variant="secondary">{String(a.status)}</Badge>}
                </div>
                <CardTitle className="mt-3 text-base">{String(a.title)}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                {a.courseTitle && <p className="mb-1">{String(a.courseTitle)}</p>}
                {a.dueDate && <p>Due: {new Date(String(a.dueDate)).toLocaleDateString()}</p>}
                {a.totalMarks != null && <p>Marks: {String(a.totalMarks)}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
