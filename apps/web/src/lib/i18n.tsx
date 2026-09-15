'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Locale = 'en' | 'ar';

const LOCALE_KEY = 'app-locale';
const DEFAULT_LOCALE: Locale = 'en';

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement: new (options: Record<string, unknown>, elementId: string) => unknown;
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  isArabic: boolean;
  t: (text: string) => string;
}

const translations: Record<string, string> = {
  Menu: 'القائمة',
  General: 'عام',
  Dashboard: 'لوحة التحكم',
  'My Courses': 'كورساتي',
  Instructors: 'المدرسون',
  'Live Classes': 'الحصص المباشرة',
  Assignments: 'الواجبات',
  Exams: 'الاختبارات',
  Surveys: 'الاستبيانات',
  Grades: 'الدرجات',
  Schedule: 'الجدول',
  Messages: 'الرسائل',
  Certificates: 'الشهادات',
  Profile: 'الملف الشخصي',
  Settings: 'الإعدادات',
  Help: 'المساعدة',
  Logout: 'تسجيل الخروج',
  Courses: 'الكورسات',
  Categories: 'التصنيفات',
  Students: 'الطلاب',
  Analytics: 'التحليلات',
  Availability: 'الأوقات المتاحة',
  Users: 'المستخدمون',
  Meetings: 'الاجتماعات',
  'Files and resources': 'الملفات والموارد',
  'Resource title (optional)': 'عنوان الملف (اختياري)',
  'Choose file from device': 'اختيار ملف من الجهاز',
  'No files uploaded yet.': 'لم يتم رفع ملفات بعد.',
  Images: 'الصور',
  'Image title (optional)': 'عنوان الصورة (اختياري)',
  'Choose image': 'اختيار صورة',
  'No images uploaded yet.': 'لم يتم رفع صور بعد.',
  'Lesson videos': 'فيديوهات الدروس',
  'Choose a lesson, then upload its video.': 'اختر درسًا ثم ارفع الفيديو الخاص به.',
  'Choose a lesson': 'اختر درسًا',
  'Choose video': 'اختيار فيديو',
  'Choose a lesson first': 'اختر درسًا أولًا',
  'Admin Dashboard': 'لوحة تحكم المسؤول',
  'Teacher Dashboard': 'لوحة تحكم المدرس',
  'Student Dashboard': 'لوحة تحكم الطالب',
  'Manage users, courses, and platform settings.': 'إدارة المستخدمين والكورسات وإعدادات المنصة.',
  'Manage your classes, students, and content.': 'إدارة فصولك وطلابك ومحتواك.',
  'Continue your learning journey.': 'تابع رحلتك التعليمية.',
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(LOCALE_KEY);
  return stored === 'ar' ? 'ar' : 'en';
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    if (document.getElementById('google-translate-script')) return;

    window.googleTranslateElementInit = () => {
      const TranslateElement = window.google?.translate?.TranslateElement;
      if (!TranslateElement || !document.getElementById('google_translate_element')) return;
      new TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: 'en,ar',
          autoDisplay: false,
        },
        'google_translate_element',
      );
    };

    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      window.googleTranslateElementInit = undefined;
    };
  }, []);

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

  useEffect(() => {
    const targetLanguage = locale === 'ar' ? 'ar' : 'en';
    let attempts = 0;
    const applyLanguage = () => {
      const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
      if (select) {
        if (select.value !== targetLanguage) {
          select.value = targetLanguage;
          select.dispatchEvent(new Event('change'));
        }
        return;
      }
      if (attempts < 30) {
        attempts += 1;
        window.setTimeout(applyLanguage, 200);
      }
    };
    applyLanguage();
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: (nextLocale) => {
        setLocaleState(nextLocale);
        if (typeof window !== 'undefined') window.localStorage.setItem(LOCALE_KEY, nextLocale);
      },
      toggleLocale: () => setLocaleState((current) => (current === 'ar' ? 'en' : 'ar')),
      isArabic: locale === 'ar',
      t: (text) => locale === 'ar' ? translations[text] ?? text : text,
    }),
    [locale],
  );

  return (
    <LocaleContext.Provider value={value}>
      <div id="google_translate_element" aria-hidden="true" />
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
