"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  isLocaleCode,
  LOCALE_STORAGE_KEY,
  type LocaleCode,
} from "@/i18n/locales";
import { i18nDictionaries, type Dict } from "@/i18n";

type I18nContextValue = {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  dict: Dict;
};

const I18nContext = createContext<I18nContextValue | null>(null);

/** Resolve a dotted key path inside the dictionary object. */
function resolvePath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

/** Replace {placeholder} tokens in a string. */
function interpolate(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(DEFAULT_LOCALE);

  // Initialize from storage / browser language once mounted
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    } catch {
      /* ignore */
    }

    let next: LocaleCode;
    if (isLocaleCode(stored)) {
      next = stored;
    } else if (typeof navigator !== "undefined" && navigator.language) {
      const nav = navigator.language.toLowerCase();
      if (nav.startsWith("zh")) next = "zh";
      else if (nav.startsWith("no")) next = "no";
      else if (nav.startsWith("fr")) next = "fr";
      else if (nav.startsWith("es")) next = "es";
      else if (nav.startsWith("pt")) next = "pt";
      else if (nav.startsWith("nl")) next = "nl";
      else next = DEFAULT_LOCALE;
    } else {
      next = DEFAULT_LOCALE;
    }

    setLocaleState(next);
  }, []);

  const setLocale = useCallback((next: LocaleCode) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  // Keep <html lang> in sync
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const value = resolvePath(i18nDictionaries[locale], key);
      if (typeof value === "string") return interpolate(value, params);
      const fallback = resolvePath(i18nDictionaries[DEFAULT_LOCALE], key);
      if (typeof fallback === "string") return interpolate(fallback, params);
      return key;
    },
    [locale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t,
      dict: i18nDictionaries[locale],
    }),
    [locale, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used inside <I18nProvider>");
  }
  return ctx;
}

/** Convenience alias */
export function useT() {
  return useI18n().t;
}