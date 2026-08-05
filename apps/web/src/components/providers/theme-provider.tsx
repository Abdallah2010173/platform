'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { applyThemeColor, getStoredThemeColor } from '@/lib/theme-settings';

export { useTheme } from 'next-themes';

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  React.useEffect(() => {
    // Apply persisted theme color on mount (before hydration completes).
    applyThemeColor(getStoredThemeColor());
  }, []);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

/**
 * Hook that keeps the theme color in sync with the DOM and next-themes.
 */
export function useThemeColor() {
  const { resolvedTheme } = useTheme();
  const [color, setColorState] = React.useState<ReturnType<typeof getStoredThemeColor>>('green');

  React.useEffect(() => {
    setColorState(getStoredThemeColor());
  }, []);

  const setColor = React.useCallback((next: ReturnType<typeof getStoredThemeColor>) => {
    setColorState(next);
    applyThemeColor(next);
    window.localStorage.setItem('app-theme-color', next);
  }, []);

  return { color, setColor, resolvedTheme };
}
