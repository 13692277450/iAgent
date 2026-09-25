import { en, type Dict } from "./en";
import { zh } from "./zh";
import { no } from "./no";
import { fr } from "./fr";
import { es } from "./es";
import { pt } from "./pt";
import { nl } from "./nl";
import type { LocaleCode } from "./locales";

export type { Dict, LocaleCode };
export { en, zh, no, fr, es, pt, nl };

export const i18nDictionaries: Record<LocaleCode, Dict> = {
  en,
  zh,
  no,
  fr,
  es,
  pt,
  nl,
};

export const dictionaries = i18nDictionaries;