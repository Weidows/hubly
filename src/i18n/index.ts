/**
 * Minimal i18n: flat dictionaries + a module-level store read through useSyncExternalStore.
 * No provider to thread through the tree, no library. Language follows the device locale
 * (en default, zh-Hans when the device is Chinese) and can be overridden in Settings.
 */
import { useMemo, useSyncExternalStore } from 'react';
import { getLocales } from 'expo-localization';

import { dictionaries, type Locale, type TranslationKey } from './dict';

const STORAGE_KEY = 'hubly.locale';

function localeFromDevice(): Locale {
  const codes = getLocales().map((l) => l.languageCode?.toLowerCase());
  return codes.some((c) => c === 'zh') ? 'zh' : 'en';
}

let locale: Locale = localeFromDevice();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function getLocale(): Locale {
  return locale;
}

export function setLocale(next: Locale) {
  if (next === locale) return;
  locale = next;
  emit();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Restore a previously chosen locale (called once at startup). */
export function hydrateLocale(saved: string | null | undefined) {
  if (saved === 'en' || saved === 'zh') setLocale(saved);
}

export const localeStorageKey = STORAGE_KEY;

export function translateFor(
  target: Locale,
  key: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  const dict = dictionaries[target] as Partial<Record<TranslationKey, string>>;
  let value = dict[key] ?? dictionaries.en[key] ?? key;
  if (vars) {
    for (const [name, replacement] of Object.entries(vars)) {
      value = value.replace(`{${name}}`, String(replacement));
    }
  }
  return value;
}

/** `const t = useT(); t('tab.repos')` */
export function useT() {
  const current = useSyncExternalStore(subscribe, getLocale, getLocale);
  return useMemo(
    () => (key: TranslationKey, vars?: Record<string, string | number>) =>
      translateFor(current, key, vars),
    [current],
  );
}

export { dictionaries };
export type { Locale, TranslationKey };
