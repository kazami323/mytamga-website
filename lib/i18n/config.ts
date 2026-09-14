export const LOCALES = ["ru", "uz", "en", "zh"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ru";

export const LOCALE_COOKIE = "NEXT_LOCALE";

// BCP 47 tags for <html lang> and hreflang: the script matters for Uzbek,
// and Chinese is the simplified form used on the mainland.
export const HTML_LANG: Record<Locale, string> = {
  ru: "ru",
  uz: "uz-Latn",
  en: "en",
  zh: "zh-Hans",
};

// `short` is what the switcher shows; `name` is the endonym screen readers
// announce. "ZH" means nothing to a Chinese reader, so Chinese shows 中文.
export const LOCALE_LABEL: Record<Locale, { short: string; name: string }> = {
  ru: { short: "RU", name: "Русский" },
  uz: { short: "UZ", name: "Oʻzbekcha" },
  en: { short: "EN", name: "English" },
  zh: { short: "中文", name: "中文" },
};

export function hasLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
