'use client';

import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStudentExams } from '@/lib/api/hooks';
import { LoadingState, EmptyState } from '@/components/dashboard/data-states';

interface ExamItem {
  id: string;
  title: string;
  type?: string;
  durationMinutes?: number;
  totalMarks?: number;
  startTime?: string | null;
  isAttempted?: boolean;
  [key: string]: unknown;
}

export default function StudentExamsPage() {
  const { data, isLoading, isError } = useStudentExams();

  const exams: ExamItem[] = Array.isArray(data)
    ? (data as ExamItem[])
    : ((data as { items?: ExamItem[] })?.items ?? []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">My Exams</h2>
        <p className="text-muted-foreground text-sm">Available exams for your courses</p>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : isError || exams.length === 0 ? (
        <EmptyState title="No exams available" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exams.map((e) => (
            <Card key={e.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                    <FileText className="text-primary h-5 w-5" />
                  </div>
                  {e.isAttempted && <Badge>Attempted</Badge>}
                </div>
                <CardTitle className="mt-3 text-base">{String(e.title)}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-2 text-sm">
                {e.durationMinutes != null && <p>Duration: {String(e.durationMinutes)} min</p>}
                {e.totalMarks != null && <p>Total Marks: {String(e.totalMarks)}</p>}
                {e.startTime && <p>Start: {new Date(String(e.startTime)).toLocaleString()}</p>}
                <Button asChild size="sm" className="w-full">
                  <a href={`/student/exams/${e.id}`}>Start Exam</a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
