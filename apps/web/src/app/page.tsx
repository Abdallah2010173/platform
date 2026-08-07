'use client';

import Link from 'next/link';
import {
  GraduationCap,
  ArrowRight,
  LayoutDashboard,
  BookOpen,
  Users,
  Video,
  ClipboardList,
  BarChart3,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ROLE_LABELS, UserRole } from '@platform/shared';
import { useAuth } from '@/components/auth/protected-route';
import { roleToRoute } from '@/lib/auth';

const roles = Object.values(UserRole);

const features = [
  {
    icon: BookOpen,
    title: 'Courses',
    desc: 'Categories, subjects, chapters, lessons, videos, PDFs, and resources.',
  },
  {
    icon: Video,
    title: 'Live Classes',
    desc: 'Zoom meetings, live classes, attendance, and recordings.',
  },
  {
    icon: ClipboardList,
    title: 'Assignments & Exams',
    desc: 'Homework, assignments, quizzes, exams, and automated grading.',
  },
  {
    icon: Award,
    title: 'Certificates',
    desc: 'Issue and verify completion certificates for your students.',
  },
  {
    icon: Users,
    title: 'User Roles',
    desc: 'Admin, Teacher, Student, and Moderator with full RBAC.',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    desc: 'Reports, analytics, payments, and platform oversight.',
  },
];

export default function HomePage() {
  const { user, isAuthenticated, ready } = useAuth();

  return (
    <div className="bg-background min-h-screen">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <GraduationCap className="text-primary h-6 w-6" />
            <span>Platform LMS</span>
          </Link>
          <nav className="flex items-center gap-4">
            {ready && isAuthenticated && user ? (
              <>
                <span className="text-muted-foreground text-sm">{ROLE_LABELS[user.role]}</span>
                <Button asChild size="sm">
                  <Link href={roleToRoute(user.role)}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-muted-foreground hover:text-foreground text-sm">
                  Sign in
                </Link>
                <Button asChild size="sm">
                  <Link href="/login">Get Started</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Enterprise Learning
            <span className="text-primary"> Management System</span>
          </h1>
          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg">
            A production-ready LMS platform built with Next.js, NestJS, PostgreSQL, and Prisma.
            Full-featured with authentication, RBAC, courses, exams, live classes, and more.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            {ready && isAuthenticated && user ? (
              <Button asChild size="lg">
                <Link href={roleToRoute(user.role)}>
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg">
                <Link href="/login">
                  Sign In <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
           <Button asChild variant="outline" size="lg">
  <Link
    href={`${process.env.NEXT_PUBLIC_API_URL}/docs`}
    target="_blank"
  >
    API Docs
  </Link>
</Button>
          </div>
        </section>

        <section className="bg-muted/40 border-t py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-8 text-center text-2xl font-semibold">Supported Roles</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {roles.map((role) => (
                <Card key={role}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{ROLE_LABELS[role]}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="font-mono text-xs">{role}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <h2 className="mb-8 text-center text-2xl font-semibold">Platform Features</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <div className="bg-primary/10 mb-2 flex h-10 w-10 items-center justify-center rounded-lg">
                    <feature.icon className="text-primary h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                  <CardDescription>{feature.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="text-muted-foreground border-t py-8 text-center text-sm">
        Platform LMS &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
