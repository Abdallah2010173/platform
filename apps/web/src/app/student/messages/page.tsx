'use client';

import { MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useStudentChats } from '@/lib/api/hooks';
import { LoadingState, EmptyState } from '@/components/dashboard/data-states';

interface ChatItem {
  id: string;
  name?: string;
  lastMessage?: string;
  lastMessageAt?: string | null;
  [key: string]: unknown;
}

export default function StudentMessagesPage() {
  const { data, isLoading, isError } = useStudentChats();

  const chats: ChatItem[] = Array.isArray(data)
    ? (data as ChatItem[])
    : ((data as { chats?: ChatItem[] })?.chats ?? []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Messages</h2>
        <p className="text-muted-foreground text-sm">Your conversations</p>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : isError || chats.length === 0 ? (
        <EmptyState title="No conversations yet" />
      ) : (
        <Card>
          <CardContent className="divide-y">
            {chats.map((c) => (
              <a
                key={c.id as string}
                href={`/student/messages/${c.id}`}
                className="hover:bg-muted/50 flex items-center justify-between py-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-full">
                    <MessageSquare className="text-primary h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{String(c.name ?? 'Chat')}</p>
                    {c.lastMessage && (
                      <p className="text-muted-foreground max-w-xs truncate text-xs">
                        {String(c.lastMessage)}
                      </p>
                    )}
                  </div>
                </div>
                {c.lastMessageAt && (
                  <span className="text-muted-foreground text-xs">
                    {new Date(String(c.lastMessageAt)).toLocaleDateString()}
                  </span>
                )}
              </a>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
