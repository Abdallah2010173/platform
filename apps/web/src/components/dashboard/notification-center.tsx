'use client';

import { useState } from 'react';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/protected-route';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { studentApi, teacherApi, formatApiError } from '@/lib/api/services';
import { toast } from 'sonner';

interface NotificationItem {
  id: string;
  title?: string;
  body?: string;
  type?: string;
  channel?: string;
  isRead?: boolean;
  createdAt?: string;
  [key: string]: unknown;
}

export function NotificationCenter() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const role = user?.role;
  const isStudent = role === 'STUDENT';
  const isTeacher = role === 'TEACHER';
  const queryKey = isStudent
    ? ['student', 'notifications']
    : isTeacher
      ? ['teacher', 'notifications']
      : ['notifications', 'unavailable'];

  const queryFn = async () => {
    if (isStudent) return studentApi.notifications({ limit: '10' });
    if (isTeacher) return teacherApi.notifications({ limit: '10' });
    return { items: [], total: 0, page: 1, limit: 10, totalPages: 0 };
  };

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn,
    enabled: open || isStudent || isTeacher,
    refetchOnWindowFocus: false,
  });

  const items: NotificationItem[] = Array.isArray(data)
    ? (data as NotificationItem[])
    : ((data as { items?: NotificationItem[] })?.items ?? []);
  const unread = items.filter((n) => !n.isRead).length;

  const markRead = useMutation({
    mutationFn: (id: string) =>
      isStudent ? studentApi.markNotificationRead(id) : teacherApi.markNotificationRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
    },
    onError: (e) => toast.error(formatApiError(e)),
  });

  const markAll = useMutation({
    mutationFn: () =>
      isStudent ? studentApi.markAllNotificationsRead() : teacherApi.markAllNotificationsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success('All notifications marked as read');
    },
    onError: (e) => toast.error(formatApiError(e)),
  });

  const handleItemClick = (n: NotificationItem) => {
    if (!n.isRead) {
      markRead.mutate(n.id);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-secondary relative h-8 w-8 transition-all duration-300 hover:scale-110"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="bg-destructive text-destructive-foreground absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary h-6 px-2 text-xs"
              onClick={() => markAll.mutate()}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="text-muted-foreground px-2 py-6 text-center text-sm">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center gap-2 px-2 py-6 text-center text-sm">
              <Inbox className="h-6 w-6 opacity-50" />
              <span>No notifications</span>
            </div>
          ) : (
            items.slice(0, 10).map((n) => (
              <DropdownMenuItem
                key={n.id}
                className="flex cursor-pointer flex-col items-start gap-0.5 py-2"
                onClick={() => handleItemClick(n)}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="text-sm font-medium">{String(n.title ?? '')}</span>
                  {!n.isRead && <Badge variant="default" className="h-2 w-2 rounded-full p-0" />}
                </div>
                {n.body && (
                  <span className="text-muted-foreground line-clamp-2 text-xs">{String(n.body)}</span>
                )}
                {n.createdAt && (
                  <span className="text-muted-foreground text-[10px]">
                    {new Date(String(n.createdAt)).toLocaleString()}
                  </span>
                )}
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
