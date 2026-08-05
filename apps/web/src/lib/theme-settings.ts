'use client';

export type ThemeColor = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'cyan' | 'pink' | 'slate';

export const THEME_COLORS: { value: ThemeColor; label: string; swatch: string }[] = [
  { value: 'blue', label: 'Blue', swatch: '#3b82f6' },
  { value: 'purple', label: 'Purple', swatch: '#8b5cf6' },
  { value: 'green', label: 'Green', swatch: '#10b981' },
  { value: 'orange', label: 'Orange', swatch: '#f97316' },
  { value: 'red', label: 'Red', swatch: '#ef4444' },
  { value: 'cyan', label: 'Cyan', swatch: '#06b6d4' },
  { value: 'pink', label: 'Pink', swatch: '#ec4899' },
  { value: 'slate', label: 'Slate', swatch: '#64748b' },
];

const THEME_COLOR_KEY = 'app-theme-color';
const THEME_MODE_KEY = 'app-theme-mode';

export type ThemeMode = 'light' | 'dark' | 'system';

export function getStoredThemeColor(): ThemeColor {
  if (typeof window === 'undefined') return 'green';
  const stored = window.localStorage.getItem(THEME_COLOR_KEY);
  if (stored && THEME_COLORS.some((c) => c.value === stored)) {
    return stored as ThemeColor;
  }
  return 'green';
}

export function storeThemeColor(color: ThemeColor): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(THEME_COLOR_KEY, color);
  document.documentElement.setAttribute('data-theme', color);
}

export function getStoredThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const stored = window.localStorage.getItem(THEME_MODE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  return 'system';
}

export function storeThemeMode(mode: ThemeMode): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(THEME_MODE_KEY, mode);
}

export function applyThemeColor(color: ThemeColor): void {
  if (typeof window === 'undefined') return;
  document.documentElement.setAttribute('data-theme', color);
}
