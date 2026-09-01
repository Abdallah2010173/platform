'use client';

import { ThemeProvider } from '@/components/providers/theme-provider';
import { ReduxProvider } from '@/components/providers/redux-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { Toaster } from '@/components/providers/toaster';
import { LocaleProvider } from '@/lib/i18n';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ReduxProvider>
        <QueryProvider>
          <LocaleProvider>{children}</LocaleProvider>
          <Toaster />
        </QueryProvider>
      </ReduxProvider>
    </ThemeProvider>
  );
}
