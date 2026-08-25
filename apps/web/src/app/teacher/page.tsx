'use client';

import { BookOpen, Users, GraduationCap, Video, ClipboardList, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTeacherStats, useTeacherCalendar, useTeacherMeetings } from '@/lib/api/hooks';
import { LoadingState } from '@/components/dashboard/data-states';

interface TeacherStats {
  myCourses?: number;
  publishedCourses?: number;
  totalStudents?: number;
  totalRevenue?: number;
  pendingHomework?: number;
  upcomingMeetings?: number;
  unreadNotifications?: number;
  averageRating?: number;
  ratingCount?: number;
  [key: string]: unknown;
}

export default function TeacherDashboardPage() {
  const { data, isLoading } = useTeacherStats();
  const { data: calendar } = useTeacherCalendar();
  const { data: meetings } = useTeacherMeetings();

  const stats = (data as TeacherStats | undefined) ?? {};

  const events = Array.isArray(calendar)
    ? (calendar as Record<string, unknown>[])
    : ((calendar as { events?: Record<string, unknown>[] })?.events ?? []);

  const upcomingMeetings = Array.isArray(meetings)
    ? (meetings as Record<string, unknown>[])
    : ((meetings as { items?: Record<string, unknown>[] })?.items ?? []);

  const statCards = [
    {
      label: 'My Courses',
      value: String(stats.myCourses ?? 0),
      icon: BookOpen,
    },
    {
      label: 'Published',
      value: String(stats.publishedCourses ?? 0),
      icon: GraduationCap,
    },
    {
      label: 'Students',
      value: String(stats.totalStudents ?? 0),
      icon: Users,
    },
    {
      label: 'Pending Homework',
      value: String(stats.pendingHomework ?? 0),
      icon: ClipboardList,
    },
    {
      label: 'Upcoming Meetings',
      value: String(stats.upcomingMeetings ?? upcomingMeetings?.length ?? 0),
      icon: Video,
    },
    {
      label: 'Calendar Events',
      value: String(events.length),
      icon: CalendarDays,
    },
  ];

  if (isLoading) {
    return <LoadingState label="Loading your dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">{s.label}</CardTitle>
              <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-lg">
                <s.icon className="text-primary h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Quick actions</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild><Link href="/teacher/courses"><BookOpen className="mr-2 h-4 w-4" />Create New Course</Link></Button>
          <Button asChild variant="outline"><Link href="/teacher/courses"><ClipboardList className="mr-2 h-4 w-4" />Add Lesson or Video</Link></Button>
          <Button asChild variant="outline"><Link href="/teacher/live-classes"><Video className="mr-2 h-4 w-4" />Schedule Live Class</Link></Button>
          <Button asChild variant="outline"><Link href="/teacher/exams"><GraduationCap className="mr-2 h-4 w-4" />Create Exam</Link></Button>
          <Button asChild variant="outline"><Link href="/teacher/surveys"><ClipboardList className="mr-2 h-4 w-4" />Create Survey</Link></Button>
          <Button asChild variant="outline"><Link href="/teacher/messages"><Users className="mr-2 h-4 w-4" />Send Message</Link></Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming Meetings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingMeetings.length === 0 ? (
              <p className="text-muted-foreground text-sm">No upcoming meetings.</p>
            ) : (
              upcomingMeetings.slice(0, 5).map((m) => (
                <div
                  key={String(m.id)}
                  className="flex items-center justify-between border-b py-2 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{String(m.topic ?? m.title ?? '')}</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(String(m.startTime ?? m.start ?? '')).toLocaleString()}
                    </p>
                  </div>
                  <span className="bg-muted rounded-full px-2 py-0.5 text-xs">
                    {String(m.status ?? 'SCHEDULED')}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {events.length === 0 ? (
              <p className="text-muted-foreground text-sm">No calendar events.</p>
            ) : (
              events.slice(0, 5).map((e) => (
                <div
                  key={String(e.id)}
                  className="flex items-center justify-between border-b py-2 last:border-0"
                >
                  <p className="text-sm font-medium">{String(e.title ?? '')}</p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(String(e.startTime ?? '')).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
