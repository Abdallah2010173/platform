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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useAllCourses } from '@/lib/api/hooks';
import { EmptyState, TableSkeleton } from '@/components/dashboard/data-states';

interface CourseItem {
  id: string;
  title?: string;
  slug?: string;
  status?: string;
  isPublished?: boolean;
  price?: number | null;
  level?: string;
  [key: string]: unknown;
}

export default function AdminCoursesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useAllCourses({
    ...(search ? { search } : {}),
    page: String(page),
    limit: '10',
  });

  const courses = Array.isArray(data)
    ? (data as CourseItem[])
    : ((data as { items?: CourseItem[] })?.items ?? []);
  const meta = !Array.isArray(data)
    ? ((data as { meta?: { totalPages?: number } })?.meta ?? {})
    : {};
  const totalPages = meta.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search courses..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : courses.length === 0 ? (
        <EmptyState title="No courses found" description="Try adjusting your search." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Price</TableHead>
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
                    <TableCell>
                      {course.price == null || course.price === 0
                        ? 'Free'
                        : `$${Number(course.price).toFixed(2)}`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              {...(page <= 1 ? { disabled: true } : {})}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink isActive={page === 1} onClick={() => setPage(1)}>
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              {...(page >= totalPages ? { disabled: true } : {})}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
