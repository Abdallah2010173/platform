'use client';

import { Bell, LogOut, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MobileNav } from './mobile-nav';
import type { ReactNode } from 'react';
import { useAuth } from '@/components/auth/protected-route';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/store';
import { clearCredentials } from '@/lib/store/slices/auth.slice';
import { useTheme } from '@/components/providers/theme-provider';
import { ROLE_LABELS } from '@platform/shared';

interface HeaderProps {
  title: string;
  description: string;
  actions?: ReactNode;
}

export function Header({ title, description, actions }: HeaderProps) {
  const { user } = useAuth();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { resolvedTheme, setTheme } = useTheme();

  const handleLogout = async () => {
    dispatch(clearCredentials());
    router.replace('/');
  };

  const initials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : (user?.firstName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U');

  return (
    <header className="animate-slide-in-up space-y-3 md:space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <MobileNav />

          <div className="text-muted-foreground hidden items-center gap-2 text-sm sm:flex">
            <span className="text-foreground font-medium">
              {user?.firstName ?? user?.email?.split('@')[0] ?? 'User'}
            </span>
            {user?.role && (
              <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
                {ROLE_LABELS[user.role]}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-secondary relative h-8 w-8 transition-all duration-300 hover:scale-110"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-secondary relative h-8 w-8 transition-all duration-300 hover:scale-110"
            aria-label="Toggle theme"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          >
            {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <div className="border-border flex items-center gap-2 border-l pl-2 md:pl-3">
            <Avatar className="ring-primary/20 hover:ring-primary/40 h-7 w-7 ring-2 transition-all duration-300 md:h-8 md:w-8">
              <AvatarImage src={user?.avatarUrl ?? ''} alt={user?.firstName ?? 'User'} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-secondary h-8 w-8 transition-all duration-300 hover:scale-110"
            aria-label="Logout"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div>
        <h1 className="text-foreground mb-1 text-xl font-bold md:text-2xl lg:text-3xl">{title}</h1>
        <p className="text-muted-foreground text-xs md:text-sm">{description}</p>
      </div>

      {actions && <div className="flex flex-col gap-2 sm:flex-row">{actions}</div>}
    </header>
  );
}
