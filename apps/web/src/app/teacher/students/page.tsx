'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTeacherStudents } from '@/lib/api/hooks';
import { LoadingState, EmptyState } from '@/components/dashboard/data-states';

interface StudentItem {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  progress?: number;
  [key: string]: unknown;
}

export default function TeacherStudentsPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useTeacherStudents(undefined, search || undefined);

  const students = Array.isArray(data)
    ? (data as StudentItem[])
    : ((data as { items?: StudentItem[] })?.items ?? []);

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <LoadingState label="Loading students..." />
      ) : students.length === 0 ? (
        <EmptyState
          title="No students found"
          description="Students enrolled in your courses will appear here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => (
            <Card key={student.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {student.firstName} {student.lastName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{student.email}</p>
                {typeof student.progress === 'number' && (
                  <p className="mt-2 text-sm font-medium">Progress: {student.progress}%</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
