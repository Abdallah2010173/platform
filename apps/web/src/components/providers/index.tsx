'use client';

import { ThemeProvider } from '@/components/providers/theme-provider';
import { ReduxProvider } from '@/components/providers/redux-provider';
import { QueryProvider } from '@/components/providers/query-provider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ReduxProvider>
        <QueryProvider>{children}</QueryProvider>
      </ReduxProvider>
    </ThemeProvider>
  );
}
