'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme, useThemeColor } from '@/components/providers/theme-provider';
import { THEME_COLORS, type ThemeColor } from '@/lib/theme-settings';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProfileImageUpload } from '@/components/profile-image-upload';
import { useAuth } from '@/components/auth/protected-route';
import { useUpdateUser } from '@/lib/api/hooks';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const updateUser = useUpdateUser();
  const { setTheme } = useTheme();
  const { color, setColor } = useThemeColor();

  const modes = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ] as const;

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardHeader><CardTitle>Profile photo</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-16 w-16"><AvatarImage src={user?.avatarUrl ?? ''} /><AvatarFallback>{user?.firstName?.[0] ?? 'A'}</AvatarFallback></Avatar>
          <ProfileImageUpload onUploaded={(avatarUrl) => user?.id && updateUser.mutate({ id: user.id, data: { avatarUrl } })} disabled={updateUser.isPending} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-medium">Theme Mode</p>
            <div className="flex gap-2">
              {modes.map((m) => (
                <Button
                  key={m.value}
                  variant="outline"
                  size="sm"
                  onClick={() => setTheme(m.value)}
                  className={cn('flex-1')}
                >
                  {m.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Theme Color</p>
            <div className="flex flex-wrap gap-2">
              {THEME_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value as ThemeColor)}
                  title={c.label}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-110',
                    color === c.value && 'ring-ring ring-2 ring-offset-2',
                  )}
                  style={{ backgroundColor: c.swatch }}
                >
                  {color === c.value && <span className="text-xs font-bold text-white">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
