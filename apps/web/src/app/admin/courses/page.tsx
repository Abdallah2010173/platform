'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Pencil, Trash2, Plus, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  useAllCourses,
  useCategories,
  useCreateCourse,
  useUpdateCourse,
  useUpdateCourseStatus,
  useDeleteCourse,
} from '@/lib/api/hooks';
import { EmptyState, TableSkeleton } from '@/components/dashboard/data-states';

interface CourseItem {
  id: string;
  title?: string;
  slug?: string;
  status?: string;
  isPublished?: boolean;
  price?: number | null;
  level?: string;
  category?: string;
  categoryId?: string;
  [key: string]: unknown;
}

interface CategoryItem {
  id: string;
  name?: string;
  [key: string]: unknown;
}

interface CourseFormState {
  title: string;
  description: string;
  shortDescription: string;
  categoryId: string;
  level: string;
  price: string;
  isFree: boolean;
  isPublished: boolean;
  isFeatured: boolean;
}

const EMPTY_FORM: CourseFormState = {
  title: '',
  description: '',
  shortDescription: '',
  categoryId: '',
  level: 'ALL_LEVELS',
  price: '',
  isFree: false,
  isPublished: true,
  isFeatured: false,
};

const LEVEL_OPTIONS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS'];

type ModalState = { type: 'create' } | { type: 'edit'; course: CourseItem } | null;

export default function AdminCoursesPage() {
  const pathname = usePathname();
  const contentBasePath = pathname.startsWith('/teacher') ? '/teacher/courses' : '/admin/courses';
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<ModalState>(null);
  const [form, setForm] = useState<CourseFormState>(EMPTY_FORM);

  const { data, isLoading } = useAllCourses({
    ...(search ? { search } : {}),
    page: String(page),
    limit: '10',
  });
  const { data: categoriesData } = useCategories({ limit: '100' });
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const updateCourseStatus = useUpdateCourseStatus();
  const deleteCourse = useDeleteCourse();

  const courses = Array.isArray(data)
    ? (data as CourseItem[])
    : ((data as { items?: CourseItem[] })?.items ?? []);
  const meta = !Array.isArray(data)
    ? ((data as { meta?: { totalPages?: number } })?.meta ?? {})
    : {};
  const totalPages = meta.totalPages ?? 1;

  const categories = Array.isArray(categoriesData)
    ? (categoriesData as CategoryItem[])
    : ((categoriesData as { items?: CategoryItem[] })?.items ?? []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModal({ type: 'create' });
  };

  const openEdit = (course: CourseItem) => {
    setForm({
      title: course.title ?? '',
      description: course.description as string | undefined ?? '',
      shortDescription: course.shortDescription as string | undefined ?? '',
      categoryId: course.categoryId ?? '',
      level: course.level ?? 'ALL_LEVELS',
      price: course.price != null ? String(course.price) : '',
      isFree: course.isFree as boolean | undefined ?? false,
      isPublished: course.isPublished ?? false,
      isFeatured: course.isFeatured as boolean | undefined ?? false,
    });
    setModal({ type: 'edit', course });
  };

  const handleSubmit = () => {
    if (!modal) return;
    const payload: Record<string, unknown> = {
      title: form.title,
      description: form.description,
      shortDescription: form.shortDescription,
      categoryId: form.categoryId || undefined,
      level: form.level,
      isFree: form.isFree,
      isPublished: form.isPublished,
      isFeatured: form.isFeatured,
    };
    if (!form.isFree && form.price !== '') {
      payload.price = Number(form.price);
    }

    if (modal.type === 'create') {
      createCourse.mutate(payload, { onSuccess: () => setModal(null) });
    } else {
      updateCourse.mutate(
        { id: modal.course.id, data: payload },
        { onSuccess: () => setModal(null) },
      );
    }
  };

  const handleTogglePublish = (course: CourseItem) => {
    const next = !course.isPublished;
    updateCourseStatus.mutate({
      id: course.id,
      data: { status: next ? 'PUBLISHED' : 'DRAFT' },
    });
  };

  const handleDelete = (course: CourseItem) => {
    if (confirm(`Are you sure you want to delete "${course.title}"?`)) {
      deleteCourse.mutate(course.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
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
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Course
        </Button>
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
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="max-w-60">
                      <div className="truncate font-medium">{String(course.title ?? '—')}</div>
                    </TableCell>
                    <TableCell>{String(course.category ?? '—')}</TableCell>
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
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={course.isPublished ? 'Unpublish course' : 'Publish course'}
                          onClick={() => handleTogglePublish(course)}
                        >
                          {course.isPublished ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Edit course"
                          onClick={() => openEdit(course)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Manage course content" asChild>
                          <Link href={`${contentBasePath}/${course.id}`}>
                            <Plus className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete course"
                          onClick={() => handleDelete(course)}
                        >
                          <Trash2 className="text-destructive h-4 w-4" />
                        </Button>
                      </div>
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

      <Dialog
        open={modal !== null}
        onOpenChange={(open) => {
          if (!open) setModal(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{modal?.type === 'edit' ? 'Edit Course' : 'Create Course'}</DialogTitle>
            <DialogDescription>
              {modal?.type === 'edit'
                ? 'Update the course details below.'
                : 'Fill in the details to create a new course.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="courseTitle">Title</Label>
              <Input
                id="courseTitle"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="courseShortDescription">Short Description</Label>
              <Input
                id="courseShortDescription"
                value={form.shortDescription}
                onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="courseDescription">Description</Label>
              <Textarea
                id="courseDescription"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => setForm({ ...form, categoryId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {String(cat.name ?? cat.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Level</Label>
                <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVEL_OPTIONS.map((lvl) => (
                      <SelectItem key={lvl} value={lvl}>
                        {lvl.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="coursePrice">Price</Label>
                <Input
                  id="coursePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  disabled={form.isFree}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="flex items-end gap-2 pb-1">
                <input
                  id="courseIsFree"
                  type="checkbox"
                  checked={form.isFree}
                  onChange={(e) => setForm({ ...form, isFree: e.target.checked })}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="courseIsFree">Free</Label>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  id="courseIsPublished"
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="courseIsPublished">Published</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="courseIsFeatured"
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="courseIsFeatured">Featured</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {modal?.type === 'edit' ? 'Save Changes' : 'Create Course'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
