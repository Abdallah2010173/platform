'use client';

import { Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStudentGrades } from '@/lib/api/hooks';
import { LoadingState, EmptyState } from '@/components/dashboard/data-states';

interface GradeItem {
  id: string;
  title: string;
  marksObtained?: number | null;
  totalMarks?: number | null;
  percentage?: number | null;
  letterGrade?: string | null;
  status?: string;
  [key: string]: unknown;
}

export default function StudentGradesPage() {
  const { data, isLoading, isError } = useStudentGrades();

  const grades: GradeItem[] = Array.isArray(data)
    ? (data as GradeItem[])
    : ((data as { items?: GradeItem[] })?.items ?? []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">My Grades</h2>
        <p className="text-muted-foreground text-sm">Your grades and performance</p>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : isError || grades.length === 0 ? (
        <EmptyState title="No grades yet" />
      ) : (
        <Card>
          <CardContent className="divide-y">
            {grades.map((g) => (
              <div key={g.id as string} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-lg">
                    <Award className="text-primary h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{String(g.title)}</p>
                    {g.percentage != null && (
                      <p className="text-muted-foreground text-xs">
                        {String(g.marksObtained ?? '-')} / {String(g.totalMarks ?? '-')} (
                        {String(g.percentage)}%)
                      </p>
                    )}
                  </div>
                </div>
                <Badge>{g.letterGrade ? String(g.letterGrade) : String(g.status ?? '')}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
