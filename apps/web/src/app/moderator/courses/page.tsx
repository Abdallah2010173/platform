'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAllCourses } from '@/lib/api/hooks';
import { EmptyState, TableSkeleton } from '@/components/dashboard/data-states';

interface CourseItem {
  id: string;
  title?: string;
  status?: string;
  isPublished?: boolean;
  level?: string;
  [key: string]: unknown;
}

export default function ModeratorCoursesPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useAllCourses({
    ...(search ? { search } : {}),
    limit: '50',
  });

  const courses = Array.isArray(data)
    ? (data as CourseItem[])
    : ((data as { items?: CourseItem[] })?.items ?? []);

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : courses.length === 0 ? (
        <EmptyState title="No courses found" description="Nothing to review yet." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{String(course.title ?? '—')}</TableCell>
                    <TableCell>
                      <Badge variant={course.isPublished ? 'success' : 'secondary'}>
                        {course.isPublished ? 'Published' : String(course.status ?? 'Draft')}
                      </Badge>
                    </TableCell>
                    <TableCell>{String(course.level ?? '—')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
