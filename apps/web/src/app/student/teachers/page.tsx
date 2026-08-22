'use client';

import { useState } from 'react';
import { Search, UserRound } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useStudentTeachers } from '@/lib/api/hooks';
import { EmptyState, LoadingState } from '@/components/dashboard/data-states';

interface TeacherItem {
  id: string;
  user?: { email?: string; profile?: { displayName?: string | null; firstName?: string; lastName?: string; avatarUrl?: string | null } };
}

export default function StudentTeachersPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useStudentTeachers(search || undefined);
  const teachers = (Array.isArray(data) ? data : []) as TeacherItem[];

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input className="pl-9" placeholder="Search instructors..." value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>
      {isLoading ? <LoadingState label="Loading instructors..." /> : teachers.length === 0 ? <EmptyState title="No instructors found" /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{teachers.map((teacher) => { const profile = teacher.user?.profile; const name = profile?.displayName || `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim() || teacher.user?.email; return <Card key={teacher.id}><CardHeader><UserRound className="text-primary h-5 w-5" /><CardTitle className="text-base">{name}</CardTitle></CardHeader><CardContent><p className="text-muted-foreground text-sm">{teacher.user?.email}</p></CardContent></Card>; })}</div>}
    </div>
  );
}
