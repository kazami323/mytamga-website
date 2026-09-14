import "server-only";

import { lang } from "next/root-params";

import { DEFAULT_LOCALE, hasLocale, type Locale } from "./config";
import { en } from "./dictionaries/en";
import { ru, type Dictionary } from "./dictionaries/ru";
import { uz } from "./dictionaries/uz";
import { zh } from "./dictionaries/zh";

const DICTIONARIES: Record<Locale, Dictionary> = { ru, uz, en, zh };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

// Server components read the locale from the root segment instead of having
// it threaded through every layer of props.
export async function getCurrentDictionary() {
  const value = await lang();
  const locale: Locale = hasLocale(value) ? value : DEFAULT_LOCALE;
  return { locale, t: getDictionary(locale) };
}
