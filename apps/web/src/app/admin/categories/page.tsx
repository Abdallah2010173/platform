'use client';

import { useState } from 'react';
import { Search, Pencil, Trash2, Plus } from 'lucide-react';
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
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/lib/api/hooks';
import { EmptyState, TableSkeleton } from '@/components/dashboard/data-states';

interface CategoryItem {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
  status?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  [key: string]: unknown;
}

interface CategoryFormState {
  name: string;
  description: string;
  icon: string;
  color: string;
  sortOrder: number;
  status: string;
  isActive: boolean;
}

const EMPTY_FORM: CategoryFormState = {
  name: '',
  description: '',
  icon: '',
  color: '#4f46e5',
  sortOrder: 0,
  status: 'ACTIVE',
  isActive: true,
};

type ModalState = { type: 'create' } | { type: 'edit'; category: CategoryItem } | null;

export default function AdminCategoriesPage() {
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<ModalState>(null);
  const [form, setForm] = useState<CategoryFormState>(EMPTY_FORM);

  const { data, isLoading } = useCategories({
    ...(search ? { search } : {}),
    limit: '50',
  });
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const categories = Array.isArray(data)
    ? (data as CategoryItem[])
    : ((data as { items?: CategoryItem[] })?.items ?? []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModal({ type: 'create' });
  };

  const openEdit = (category: CategoryItem) => {
    setForm({
      name: category.name ?? '',
      description: category.description ?? '',
      icon: category.icon ?? '',
      color: category.color ?? '#4f46e5',
      sortOrder: category.sortOrder ?? 0,
      status: category.status ?? 'ACTIVE',
      isActive: category.isActive ?? true,
    });
    setModal({ type: 'edit', category });
  };

  const handleSubmit = () => {
    if (!modal) return;
    const payload = {
      name: form.name,
      description: form.description,
      icon: form.icon,
      color: form.color,
      sortOrder: form.sortOrder,
      status: form.status,
      isActive: form.isActive,
    };

    if (modal.type === 'create') {
      createCategory.mutate(payload, { onSuccess: () => setModal(null) });
    } else {
      updateCategory.mutate(
        { id: modal.category.id, data: payload },
        { onSuccess: () => setModal(null) },
      );
    }
  };

  const handleDelete = (category: CategoryItem) => {
    if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
      deleteCategory.mutate(category.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Category
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : categories.length === 0 ? (
        <EmptyState title="No categories found" description="Create a category to get started." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Sort</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {category.color && (
                          <span
                            className="inline-block h-3 w-3 rounded-full"
                            style={{ backgroundColor: String(category.color) }}
                          />
                        )}
                        {category.icon && (
                          <span className="text-muted-foreground">{category.icon}</span>
                        )}
                        {String(category.name ?? '—')}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {String(category.slug ?? '—')}
                    </TableCell>
                    <TableCell>{String(category.sortOrder ?? 0)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{String(category.status ?? '—')}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={category.isActive ? 'success' : 'destructive'}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Edit category"
                          onClick={() => openEdit(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete category"
                          onClick={() => handleDelete(category)}
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

      <Dialog
        open={modal !== null}
        onOpenChange={(open) => {
          if (!open) setModal(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modal?.type === 'edit' ? 'Edit Category' : 'Create Category'}
            </DialogTitle>
            <DialogDescription>
              {modal?.type === 'edit'
                ? 'Update the category details below.'
                : 'Fill in the details to create a new category.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="categoryName">Name</Label>
              <Input
                id="categoryName"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="categoryDescription">Description</Label>
              <Textarea
                id="categoryDescription"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="categoryIcon">Icon</Label>
                <Input
                  id="categoryIcon"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="📚"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="categoryColor">Color</Label>
                <Input
                  id="categoryColor"
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="h-9 p-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="categorySortOrder">Sort Order</Label>
                <Input
                  id="categorySortOrder"
                  type="number"
                  value={String(form.sortOrder)}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="categoryIsActive"
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="categoryIsActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {modal?.type === 'edit' ? 'Save Changes' : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
