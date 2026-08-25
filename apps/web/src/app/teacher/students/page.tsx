'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAllTeacherStudents } from '@/lib/api/hooks';
import { LoadingState, EmptyState } from '@/components/dashboard/data-states';

interface StudentItem {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  progress?: number;
  enrolledCourses?: { id: string; title: string; progress: number; status: string }[];
  [key: string]: unknown;
}

export default function TeacherStudentsPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useAllTeacherStudents(search || undefined);

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
          description="Active students on the platform will appear here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => (
            <Card key={student.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {String(student.name ?? `${student.firstName ?? ''} ${student.lastName ?? ''}`)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{student.email}</p>
                <p className="mt-2 text-sm font-medium">{student.enrolledCourses?.length ?? 0} enrolled courses</p>
                {student.enrolledCourses?.slice(0, 3).map((course) => (
                  <p key={course.id} className="text-muted-foreground text-xs">{course.title} · {course.progress}%</p>
                ))}
                <Button asChild size="sm" variant="outline" className="mt-3"><Link href={`/teacher/messages?studentId=${student.userId ?? student.id}`}>Message student</Link></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
