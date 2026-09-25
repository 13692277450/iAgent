/**
 * i18n locale metadata
 *
 * Supported locales:
 *  - en  English (default)
 *  - zh  Simplified Chinese
 *  - no  Norwegian (Bokmål)
 *  - fr  French
 *  - es  Spanish
 *  - pt  Portuguese
 *  - nl  Dutch (Belgium / Vlaams)
 */

export const LOCALES = [
  { code: "en", label: "English", short: "EN", native: "English", flag: "🇬🇧" },
  { code: "zh", label: "简体中文", short: "ZH", native: "中文", flag: "🇨🇳" },
  { code: "no", label: "Norsk", short: "NO", native: "Norsk", flag: "🇳🇴" },
  { code: "fr", label: "Français", short: "FR", native: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", short: "ES", native: "Español", flag: "🇪🇸" },
  { code: "pt", label: "Português", short: "PT", native: "Português", flag: "🇵🇹" },
  { code: "nl", label: "Nederlands (België)", short: "NL", native: "Nederlands", flag: "🇧🇪" },
] as const;

export type LocaleCode = (typeof LOCALES)[number]["code"];

export const DEFAULT_LOCALE: LocaleCode = "en";

export const LOCALE_STORAGE_KEY = "iagent-locale";

export function isLocaleCode(value: string | null | undefined): value is LocaleCode {
  return !!value && LOCALES.some((l) => l.code === value);
}