'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { appConfig, supportedLocales, type Locale } from '@/config/app-config';
import { es } from '@/lib/i18n/es';
import { en } from '@/lib/i18n/en';
import type { MessageKey, MessageParams, Messages } from '@/lib/i18n/types';

const dictionaries: Record<Locale, Messages> = { es, en };
const intlLocales: Record<Locale, string> = { es: 'es-PE', en: 'en-US' };

function resolve(messages: Messages, key: string) {
  return key
    .split('.')
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === 'object'
          ? (node as Record<string, unknown>)[part]
          : undefined,
      messages,
    );
}

export function translate(
  locale: Locale,
  key: MessageKey,
  params: MessageParams = {},
) {
  const value = resolve(dictionaries[locale], key);
  const template =
    typeof value === 'string'
      ? value
      : ((resolve(dictionaries.es, key) as string | undefined) ?? key);
  return template.replace(/\{(\w+)\}/g, (match: string, name: string) =>
    params[name] !== undefined ? String(params[name]) : match,
  );
}

function detectLocale(): Locale {
  try {
    const stored = localStorage.getItem(appConfig.storageKeys.locale);
    if (stored && supportedLocales.includes(stored as Locale))
      return stored as Locale;
  } catch {
    return appConfig.defaultLocale;
  }
  return appConfig.defaultLocale;
}

function createFormatters(locale: Locale) {
  const intlLocale = intlLocales[locale];
  const timeZone = appConfig.timeZone;
  const money = new Intl.NumberFormat(intlLocale, {
    style: 'currency',
    currency: appConfig.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const currencySymbol =
    new Intl.NumberFormat(intlLocales[appConfig.defaultLocale], {
      style: 'currency',
      currency: appConfig.currency,
    })
      .formatToParts(0)
      .find((part) => part.type === 'currency')?.value ?? appConfig.currency;
  const formatMoney = (value: number) =>
    money
      .formatToParts(value)
      .map((part) => (part.type === 'currency' ? currencySymbol : part.value))
      .join('');
  const dateTime = new Intl.DateTimeFormat(intlLocale, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  });
  const date = new Intl.DateTimeFormat(intlLocale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone,
  });
  const longDate = new Intl.DateTimeFormat(intlLocale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone,
  });
  const time = new Intl.DateTimeFormat(intlLocale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  });
  const monthYear = new Intl.DateTimeFormat(intlLocale, {
    month: 'long',
    year: 'numeric',
    timeZone,
  });
  const weekday = new Intl.DateTimeFormat(intlLocale, {
    weekday: 'short',
    timeZone,
  });
  const dayNumber = new Intl.DateTimeFormat(intlLocale, {
    day: 'numeric',
    timeZone,
  });
  const relative = new Intl.RelativeTimeFormat(intlLocale, { numeric: 'auto' });
  const number = new Intl.NumberFormat(intlLocale, {
    maximumFractionDigits: 1,
  });
  const safe =
    (formatter: Intl.DateTimeFormat, capitalize = false) =>
    (value: string | Date | undefined) => {
      if (!value) return '—';
      const parsed = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(parsed.getTime())) return '—';
      const text = formatter.format(parsed);
      return capitalize
        ? text.charAt(0).toLocaleUpperCase(intlLocale) + text.slice(1)
        : text;
    };
  return {
    formatMoney,
    formatNumber: (value: number) => number.format(value),
    formatDateTime: safe(dateTime),
    formatDate: safe(date),
    formatLongDate: safe(longDate, true),
    formatTime: safe(time),
    formatMonthYear: safe(monthYear, true),
    formatWeekday: safe(weekday),
    formatDayNumber: safe(dayNumber),
    formatRelative: (value: string) => {
      const diff = new Date(value).getTime() - Date.now();
      const minutes = Math.round(diff / 60_000);
      if (Math.abs(minutes) < 60) return relative.format(minutes, 'minute');
      const hours = Math.round(minutes / 60);
      if (Math.abs(hours) < 24) return relative.format(hours, 'hour');
      return relative.format(Math.round(hours / 24), 'day');
    },
  };
}

type Formatters = ReturnType<typeof createFormatters>;
interface I18nContextValue extends Formatters {
  locale: Locale;
  intlLocale: string;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, params?: MessageParams) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(appConfig.defaultLocale);

  useEffect(() => {
    setLocaleState(detectLocale());
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = translate(locale, 'meta.title');
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(appConfig.storageKeys.locale, next);
    } catch {
      return;
    }
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      intlLocale: intlLocales[locale],
      setLocale,
      t: (key, params) => translate(locale, key, params),
      ...createFormatters(locale),
    }),
    [locale, setLocale],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}

export type { MessageKey } from '@/lib/i18n/types';
