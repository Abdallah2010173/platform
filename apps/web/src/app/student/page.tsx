'use client';

import Link from 'next/link';
import { BookOpen, Video, ClipboardList, GraduationCap, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/protected-route';
import { StatsCards, type StatItem } from '@/components/dashboard/stats-cards';
import { StatSkeleton, LoadingState, EmptyState } from '@/components/dashboard/data-states';
import { useStudentHomeStats, useStudentToday, useStudentUpcomingMeetings } from '@/lib/api/hooks';

interface TodayItem {
  title?: string;
  type?: string;
  time?: string | null;
  startTime?: string | null;
  [key: string]: unknown;
}

interface MeetingItem {
  id: string;
  topic?: string;
  title?: string;
  startTime?: string | null;
  start?: string | null;
  [key: string]: unknown;
}

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useStudentHomeStats();
  const { data: today, isLoading: todayLoading } = useStudentToday();
  const { data: meetings, isLoading: meetingsLoading } = useStudentUpcomingMeetings();

  const statItems: StatItem[] = [
    {
      title: 'My Courses',
      value: stats?.myCourses ?? 0,
      increase: `${stats?.activeCourses ?? 0} active`,
      accent: true,
    },
    {
      title: 'Average Progress',
      value: `${stats?.averageProgress ?? 0}%`,
      subtitle: 'Overall',
    },
    {
      title: 'Certificates Earned',
      value: stats?.certificatesEarned ?? 0,
      subtitle: 'Achievements',
    },
    {
      title: 'Upcoming Exams',
      value: stats?.upcomingExams ?? 0,
      subtitle: 'To prepare',
    },
  ];

  const todayItems: TodayItem[] = Array.isArray(today)
    ? today
    : ((today?.events as TodayItem[]) ?? []);

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-lg font-semibold">
          Welcome back, {user?.firstName ?? user?.email?.split('@')[0] ?? 'Student'}
        </h2>
        <p className="text-muted-foreground text-sm">Continue your learning journey.</p>
      </div>

      {isLoading || !stats ? <StatSkeleton /> : <StatsCards stats={statItems} />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Schedule</CardTitle>
              <CardDescription>Your upcoming classes and deadlines</CardDescription>
            </CardHeader>
            <CardContent>
              {todayLoading ? (
                <LoadingState />
              ) : todayItems.length === 0 ? (
                <EmptyState title="Nothing scheduled today" description="Enjoy your free time!" />
              ) : (
                <div className="divide-y">
                  {todayItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 py-3">
                      <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                        <GraduationCap className="text-primary h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{String(item.title ?? '')}</p>
                        <p className="text-muted-foreground text-xs">
                          {String(item.type ?? '')} • {String(item.time ?? item.startTime ?? '')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              <Button asChild variant="outline" className="justify-start">
                <Link href="/student/courses">
                  <BookOpen className="mr-2 h-4 w-4" /> My Courses
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/student/assignments">
                  <ClipboardList className="mr-2 h-4 w-4" /> Assignments
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/student/exams">
                  <GraduationCap className="mr-2 h-4 w-4" /> Exams
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/student/live-classes">
                  <Video className="mr-2 h-4 w-4" /> Live Classes
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Live Classes</CardTitle>
              <CardDescription>Join your scheduled sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {meetingsLoading ? (
                <LoadingState />
              ) : !meetings || (meetings as unknown[]).length === 0 ? (
                <EmptyState title="No upcoming classes" />
              ) : (
                (meetings as MeetingItem[]).slice(0, 4).map((m) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                      <Video className="text-primary h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{String(m.topic ?? m.title ?? '')}</p>
                      <p className="text-muted-foreground text-xs">
                        {new Date(String(m.startTime ?? m.start ?? '')).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <Button asChild variant="outline" className="w-full">
                <Link href="/student/live-classes">
                  View all classes <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
