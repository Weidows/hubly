import { en } from './en';
import { zh } from './zh';

export const dictionaries = { en, zh } as const;
export type Locale = keyof typeof dictionaries;
export type TranslationKey = keyof typeof en;

/** Flat key/value dictionaries — small enough that a full i18n library would be dead weight. */
export type Dictionary = Record<TranslationKey, string>;
