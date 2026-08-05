'use client';

import { Sidebar } from './sidebar';
import { Header } from './header';
import type { ReactNode } from 'react';

interface DashboardLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
}

export default function DashboardLayout({
  title,
  description,
  children,
  actions,
}: DashboardLayoutProps) {
  return (
    <div className="bg-background flex min-h-screen">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <main className="flex-1 p-4 lg:ml-64 lg:p-6">
        <Header title={title} description={description} actions={actions} />
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}
