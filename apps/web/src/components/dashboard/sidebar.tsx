'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
          <Image
            src="/logo.png"
            alt="Global Math"
            width={72}
            height={72}
            className="h-[4.5rem] w-[4.5rem] rounded-full object-cover shadow-sm transition-transform duration-300 group-hover:scale-105"
            priority
          />
          <span className="text-foreground text-lg font-semibold">Global Math</span>
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
