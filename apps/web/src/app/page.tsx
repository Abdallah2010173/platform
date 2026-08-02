import Link from 'next/link';
import { GraduationCap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ROLE_LABELS, UserRole } from '@platform/shared';

const roles = Object.values(UserRole);

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span>Platform LMS</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Sign in
            </Link>
            <Button asChild size="sm">
              <Link href="/login">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Enterprise Learning
            <span className="text-primary"> Management System</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            A production-ready LMS platform built with Next.js 15, NestJS, PostgreSQL, and Prisma.
            Phase 1 foundation is complete — authentication, RBAC, and clean architecture are in place.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/login">
                Sign In <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="http://localhost:4000/docs" target="_blank">
                API Docs
              </Link>
            </Button>
          </div>
        </section>

        <section className="border-t bg-muted/40 py-16">
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
          <h2 className="mb-8 text-center text-2xl font-semibold">Phase 1 — Foundation</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: 'Monorepo', desc: 'pnpm workspaces with Turbo, shared packages' },
              { title: 'Clean Architecture', desc: 'Domain, application, infrastructure, presentation layers' },
              { title: 'JWT Auth', desc: 'Access + refresh tokens with rotation and RBAC guards' },
              { title: 'PostgreSQL + Prisma', desc: 'Initial schema with users, roles, permissions, audit logs' },
              { title: 'Docker', desc: 'PostgreSQL and Redis containers ready' },
              { title: 'Next.js 15 + shadcn/ui', desc: 'Tailwind CSS v4, dark mode, Redux, React Query' },
            ].map((item) => (
              <Card key={item.title}>
                <CardHeader>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <CardDescription>{item.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        Platform LMS &copy; {new Date().getFullYear()} — Phase 1 Foundation
      </footer>
    </div>
  );
}
