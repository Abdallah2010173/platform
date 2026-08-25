import MessagesWorkspace from '@/components/dashboard/messages-workspace';

export default function TeacherMessagesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Messages</h2>
        <p className="text-muted-foreground text-sm">Message any active student on Global Math.</p>
      </div>
      <MessagesWorkspace />
    </div>
  );
}
