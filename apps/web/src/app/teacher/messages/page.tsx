import MessagesWorkspace from '@/components/dashboard/messages-workspace';

export default function TeacherMessagesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Messages</h2>
        <p className="text-muted-foreground text-sm">Message students enrolled in your courses.</p>
      </div>
      <MessagesWorkspace />
    </div>
  );
}
