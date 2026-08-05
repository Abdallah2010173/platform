'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/protected-route';
import { getNavForRole } from '@/lib/navigation';

export function Sidebar() {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const pathname = usePathname();
  const { user } = useAuth();

  const sections = getNavForRole(user?.role);

  return (
    <aside className="bg-card border-border fixed left-0 top-0 h-screen w-64 overflow-y-auto border-r p-4 lg:block">
      <div className="group mb-6 flex cursor-pointer items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary relative flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110">
            <div
              className="bg-primary-foreground absolute h-1.5 w-1.5 rounded-full"
              style={{ top: '30%', left: '30%' }}
            />
            <div
              className="bg-primary-foreground absolute h-1.5 w-1.5 rounded-full"
              style={{ top: '30%', right: '30%' }}
            />
            <div className="border-primary-foreground absolute bottom-2.5 h-1.5 w-3 rounded-full border-b-2" />
          </div>
          <span className="text-foreground text-lg font-semibold">Platform LMS</span>
        </Link>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="text-muted-foreground mb-2 text-[10px] font-medium uppercase tracking-wider">
              {section.label}
            </p>
            <nav className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const key = item.label + item.href;
                return (
                  <Link
                    key={key}
                    href={item.href}
                    onMouseEnter={() => setHoveredItem(item.label)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-300',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-primary/20 shadow-lg'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                      hoveredItem === item.label && !isActive && 'translate-x-1',
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="text-sm">{item.label}</span>
                    {item.badge && (
                      <span className="bg-primary text-primary-foreground ml-auto animate-pulse rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
}
