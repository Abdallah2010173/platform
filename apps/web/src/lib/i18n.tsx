'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Locale = 'en' | 'ar';

const LOCALE_KEY = 'app-locale';
const DEFAULT_LOCALE: Locale = 'en';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  isArabic: boolean;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(LOCALE_KEY);
  return stored === 'ar' ? 'ar' : 'en';
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    setLocaleState(getStoredLocale());
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
      document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
      window.localStorage.setItem(LOCALE_KEY, locale);
    }
  }, [locale]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocale = getStoredLocale();
      if (savedLocale !== locale) {
        setLocaleState(savedLocale);
      }
    }
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: (nextLocale) => setLocaleState(nextLocale),
      toggleLocale: () => setLocaleState((current) => (current === 'ar' ? 'en' : 'ar')),
      isArabic: locale === 'ar',
    }),
    [locale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
