'use client';

import { useState } from 'react';
import {
  Search,
  Trash2,
  ShieldCheck,
  ShieldBan,
  KeyRound,
  Pencil,
  UserPlus,
} from 'lucide-react';
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
  PaginationEllipsis,
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
import {
  useAdminUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useChangeUserPassword,
} from '@/lib/api/hooks';
import { EmptyState, TableSkeleton } from '@/components/dashboard/data-states';

interface UserItem {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isActive?: boolean;
  createdAt?: string;
  fullName?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    avatarUrl?: string;
  };
  [key: string]: unknown;
}

const ROLE_OPTIONS = ['STUDENT', 'TEACHER', 'ADMIN'];

interface UserFormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  isActive: boolean;
}

const EMPTY_FORM: UserFormState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'STUDENT',
  isActive: true,
};

type ModalState =
  | { type: 'create' }
  | { type: 'edit'; user: UserItem }
  | { type: 'password'; user: UserItem }
  | null;

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [modal, setModal] = useState<ModalState>(null);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);
  const [newPassword, setNewPassword] = useState('');

  const { data, isLoading } = useAdminUsers({
    ...(search ? { search } : {}),
    ...(roleFilter !== 'ALL' ? { role: roleFilter } : {}),
    page: String(page),
    limit: '10',
  });
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const changeUserPassword = useChangeUserPassword();

  const users = Array.isArray(data)
    ? (data as UserItem[])
    : ((data as { items?: UserItem[] })?.items ?? []);
  const pagination = !Array.isArray(data)
    ? ((data as { meta?: { total?: number; totalPages?: number; page?: number } })?.meta ?? {})
    : {};
  const totalPages = pagination.totalPages ?? 1;

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModal({ type: 'create' });
  };

  const openEdit = (user: UserItem) => {
    setForm({
      firstName: user.profile?.firstName ?? user.firstName ?? '',
      lastName: user.profile?.lastName ?? user.lastName ?? '',
      email: user.email ?? '',
      password: '',
      role: user.role ?? 'STUDENT',
      isActive: user.isActive ?? true,
    });
    setModal({ type: 'edit', user });
  };

  const openPassword = (user: UserItem) => {
    setNewPassword('');
    setModal({ type: 'password', user });
  };

  const handleSubmit = () => {
    if (!modal) return;
    if (modal.type === 'create') {
      createUser.mutate(
        {
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          role: form.role,
          isActive: form.isActive,
        },
        { onSuccess: () => setModal(null) },
      );
    } else if (modal.type === 'edit') {
      const payload: Record<string, unknown> = {
        isActive: form.isActive,
        role: form.role,
        firstName: form.firstName,
        lastName: form.lastName,
      };
      if (form.email && form.email !== modal.user.email) {
        payload.email = form.email;
      }
      updateUser.mutate(
        { id: modal.user.id, data: payload },
        { onSuccess: () => setModal(null) },
      );
    }
  };

  const handleToggleActive = (user: UserItem) => {
    if (user.isActive && !window.confirm('Are you sure you want to deactivate this account?')) return;
    updateUser.mutate({
      id: user.id,
      data: { isActive: !user.isActive },
    });
  };

  const handleResetPassword = () => {
    if (!modal || modal.type !== 'password') return;
    if (!newPassword) return;
    changeUserPassword.mutate(
      { id: modal.user.id, password: newPassword },
      { onSuccess: () => setModal(null) },
    );
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUser.mutate(id);
    }
  };

  const userName = (user: UserItem) =>
    user.profile?.displayName ||
    user.fullName ||
    String(user.profile?.firstName ?? user.firstName ?? user.email ?? '—');

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={(value) => { setRoleFilter(value); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All roles</SelectItem>
            <SelectItem value="STUDENT">Students</SelectItem>
            <SelectItem value="TEACHER">Instructors</SelectItem>
            <SelectItem value="ADMIN">Admins</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={openCreate}>
          <UserPlus className="mr-2 h-4 w-4" />
          New User
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : users.length === 0 ? (
        <EmptyState title="No users found" description="Try adjusting your search or filters." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{userName(user)}</TableCell>
                    <TableCell>{String(user.email ?? '—')}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {user.role === 'TEACHER' ? 'Instructor' : user.role === 'ADMIN' ? 'Admin' : 'Student'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(user)}
                        className="px-0"
                      >
                        <Badge variant={user.isActive ? 'success' : 'destructive'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Edit user"
                          onClick={() => openEdit(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Reset password"
                          onClick={() => openPassword(user)}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={
                            user.isActive ? 'Suspend user' : 'Activate user'
                          }
                          onClick={() => handleToggleActive(user)}
                        >
                          {user.isActive ? (
                            <ShieldBan className="text-amber-500 h-4 w-4" />
                          ) : (
                            <ShieldCheck className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete user"
                          onClick={() => handleDelete(user.id)}
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
          {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
            const p = i + 1;
            return (
              <PaginationItem key={p}>
                <PaginationLink isActive={p === page} onClick={() => setPage(p)}>
                  {p}
                </PaginationLink>
              </PaginationItem>
            );
          })}
          {totalPages > 5 && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}
          <PaginationItem>
            <PaginationNext
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              {...(page >= totalPages ? { disabled: true } : {})}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {/* Create / Edit modal */}
      <Dialog
        open={modal?.type === 'create' || modal?.type === 'edit'}
        onOpenChange={(open) => {
          if (!open) setModal(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modal?.type === 'edit' ? 'Edit User' : 'Create User'}</DialogTitle>
            <DialogDescription>
              {modal?.type === 'edit'
                ? 'Update the user details below.'
                : 'Fill in the details to create a new user account.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            {modal?.type === 'create' && (
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label>Role</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r === 'TEACHER' ? 'Instructor' : r === 'ADMIN' ? 'Admin' : 'Student'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="isActive"
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {modal?.type === 'edit' ? 'Save Changes' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset password modal */}
      <Dialog
        open={modal?.type === 'password'}
        onOpenChange={(open) => {
          if (!open) setModal(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {modal?.type === 'password' ? userName(modal.user) : ''}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={!newPassword}>
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
