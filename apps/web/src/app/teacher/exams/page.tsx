'use client';

import { GraduationCap, Timer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTeacherExams } from '@/lib/api/hooks';
import { LoadingState, EmptyState } from '@/components/dashboard/data-states';

interface ExamItem {
  id: string;
  title: string;
  type?: string | null;
  durationMinutes?: number;
  totalMarks?: number;
  isPublished?: boolean;
  [key: string]: unknown;
}

export default function TeacherExamsPage() {
  const { data, isLoading } = useTeacherExams();

  const exams = Array.isArray(data)
    ? (data as ExamItem[])
    : ((data as { items?: ExamItem[] })?.items ?? []);

  if (isLoading) return <LoadingState label="Loading exams..." />;

  if (exams.length === 0) {
    return <EmptyState title="No exams yet" description="Exams you create will appear here." />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {exams.map((exam) => (
        <Card key={exam.id}>
          <CardHeader className="flex flex-row items-start justify-between">
            <CardTitle className="text-base">{exam.title}</CardTitle>
            <Badge variant={exam.isPublished ? 'default' : 'secondary'}>
              {exam.isPublished ? 'Published' : 'Draft'}
            </Badge>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-2 text-sm">
            <p className="flex items-center gap-1">
              <GraduationCap className="h-4 w-4" />
              {String(exam.type ?? 'MIXED')}
            </p>
            <p className="flex items-center gap-1">
              <Timer className="h-4 w-4" />
              {String(exam.durationMinutes ?? 0)} min · {String(exam.totalMarks ?? 0)} marks
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
