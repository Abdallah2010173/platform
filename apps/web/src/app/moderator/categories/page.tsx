'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useCategories } from '@/lib/api/hooks';
import { EmptyState, TableSkeleton } from '@/components/dashboard/data-states';

interface CategoryItem {
  id: string;
  name?: string;
  slug?: string;
  status?: string;
  isPublished?: boolean;
  [key: string]: unknown;
}

export default function ModeratorCategoriesPage() {
  const { data, isLoading } = useCategories({ limit: '50' });

  const categories = Array.isArray(data)
    ? (data as CategoryItem[])
    : ((data as { items?: CategoryItem[] })?.items ?? []);

  if (isLoading) {
    return <TableSkeleton rows={5} />;
  }

  if (categories.length === 0) {
    return <EmptyState title="No categories found" description="Nothing to review yet." />;
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{String(category.name ?? '—')}</TableCell>
                <TableCell className="font-mono text-xs">{String(category.slug ?? '—')}</TableCell>
                <TableCell>
                  <Badge variant={category.isPublished ? 'success' : 'secondary'}>
                    {category.isPublished ? 'Published' : String(category.status ?? 'Draft')}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
