'use client';

import { Loader2, Inbox } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="text-muted-foreground flex min-h-50 flex-col items-center justify-center gap-3">
      <Loader2 className="text-primary h-6 w-6 animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({
  title = 'No data available',
  description,
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-50 flex-col items-center justify-center gap-3 text-center">
      <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
        <Inbox className="text-muted-foreground h-6 w-6" />
      </div>
      <div>
        <p className="text-foreground font-medium">{title}</p>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  );
}
