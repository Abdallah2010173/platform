'use client';

import { FormEvent, useState } from 'react';
import { MessageSquare, Search, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoadingState, EmptyState } from '@/components/dashboard/data-states';
import {
  useMessageContacts,
  useMessageConversations,
  useMessageHistory,
  useSendMessage,
  useStartDirectChat,
} from '@/lib/api/hooks';

interface Contact { id: string; name?: string; email?: string; }
interface Conversation { id: string; name?: string; lastMessage?: string | null; unreadCount?: number; }
interface Message { id: string; content?: string | null; senderId: string; senderName?: string; createdAt: string; }

export default function MessagesWorkspace() {
  const [search, setSearch] = useState('');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const contactsQuery = useMessageContacts(search);
  const conversationsQuery = useMessageConversations();
  const historyQuery = useMessageHistory(selectedChat);
  const startChat = useStartDirectChat();
  const sendMessage = useSendMessage();

  const contacts = (Array.isArray(contactsQuery.data) ? contactsQuery.data : []) as Contact[];
  const conversations = (Array.isArray(conversationsQuery.data) ? conversationsQuery.data : []) as Conversation[];
  const messages = (Array.isArray(historyQuery.data) ? historyQuery.data : []) as Message[];
  const selected = conversations.find((conversation) => conversation.id === selectedChat);

  const openContact = (contact: Contact) => {
    startChat.mutate(contact.id, { onSuccess: (chat) => setSelectedChat((chat as { id: string }).id) });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedChat || !draft.trim()) return;
    sendMessage.mutate({ chatId: selectedChat, content: draft.trim() }, { onSuccess: () => setDraft('') });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <Card>
        <CardHeader><CardTitle className="text-base">Conversations</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="text-muted-foreground absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input className="pl-9" placeholder="Search contacts" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <button key={conversation.id} type="button" onClick={() => setSelectedChat(conversation.id)} className="hover:bg-muted flex w-full items-start gap-2 rounded-md p-2 text-left">
                <MessageSquare className="mt-0.5 h-4 w-4" />
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{conversation.name ?? 'Conversation'}</span><span className="text-muted-foreground block truncate text-xs">{conversation.lastMessage ?? 'No messages yet'}</span></span>
                {!!conversation.unreadCount && <span className="bg-primary text-primary-foreground rounded-full px-1.5 text-xs">{conversation.unreadCount}</span>}
              </button>
            ))}
          </div>
          <div className="border-t pt-3">
            <p className="text-muted-foreground mb-2 text-xs font-medium">Start a conversation</p>
            {contactsQuery.isLoading ? <LoadingState /> : contacts.length === 0 ? <p className="text-muted-foreground text-xs">No permitted contacts.</p> : contacts.map((contact) => <button key={contact.id} type="button" onClick={() => openContact(contact)} className="hover:bg-muted block w-full rounded-md p-2 text-left text-sm">{contact.name ?? contact.email}</button>)}
          </div>
        </CardContent>
      </Card>
      <Card className="min-h-105">
        <CardHeader><CardTitle className="text-base">{selected?.name ?? 'Select a conversation'}</CardTitle></CardHeader>
        <CardContent className="flex min-h-85 flex-col">
          {!selectedChat ? <EmptyState title="Choose a conversation" description="Select a permitted contact or an existing conversation." /> : historyQuery.isLoading ? <LoadingState /> : <>
            <div className="flex-1 space-y-3 overflow-y-auto py-2">{messages.map((message) => <div key={message.id} className="rounded-md border p-2 text-sm"><p>{message.content}</p><p className="text-muted-foreground mt-1 text-xs">{message.senderName ?? 'User'} · {new Date(message.createdAt).toLocaleString()}</p></div>)}</div>
            <form onSubmit={submit} className="mt-4 flex gap-2"><Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message" maxLength={5000} /><Button type="submit" disabled={!draft.trim() || sendMessage.isPending} aria-label="Send message"><Send className="h-4 w-4" /></Button></form>
          </>}
        </CardContent>
      </Card>
    </div>
  );
}
