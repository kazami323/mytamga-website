import { DEFAULT_LOCALE, HTML_LANG, LOCALES, type Locale } from "./i18n/config.ts";

/**
 * Адреса и теги для поисковиков. Модуль без `@/`-импортов, чтобы его проверял
 * `node --test`.
 */

const FALLBACK_SITE_URL = "https://mytamga.uz";

/** Страницы, которые должны быть в индексе. Путь — без языка. */
export const INDEXABLE_PATHS = [
  "",
  "/pricing",
  "/support",
  "/delete-account",
  "/privacy",
  "/terms",
  "/offer",
] as const;

export type IndexablePath = (typeof INDEXABLE_PATHS)[number];

export const SITE_NAME = "MyTamga";

/** Адрес сайта без завершающего слэша. */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return (raw || FALLBACK_SITE_URL).replace(/\/+$/, "");
}

/** Для hreflang: узбекский — просто "uz", остальные — как в HTML_LANG. */
export const HREFLANG: Record<Locale, string> = {
  ru: "ru",
  uz: "uz",
  en: "en",
  zh: HTML_LANG.zh,
};

const OG_LOCALE: Record<Locale, string> = {
  ru: "ru_RU",
  uz: "uz_UZ",
  en: "en_US",
  zh: "zh_CN",
};

export function pageUrl(lang: Locale, path: string): string {
  return `${siteUrl()}/${lang}${path}`;
}

/** Канонический адрес и все языковые варианты страницы (+ x-default → ru). */
export function seoAlternates(lang: Locale, path: string) {
  return {
    canonical: pageUrl(lang, path),
    languages: {
      ...Object.fromEntries(LOCALES.map((l) => [HREFLANG[l], pageUrl(l, path)])),
      "x-default": pageUrl(DEFAULT_LOCALE, path),
    } as Record<string, string>,
  };
}

/** Только языки — для карты сайта. */
export function seoLanguages(path: string): Record<string, string> {
  return seoAlternates(DEFAULT_LOCALE, path).languages;
}

/**
 * Картинка для предпросмотра ссылок — статичный public/og-image.png (копия
 * app/[lang]/opengraph-image.png). Страница со своим openGraph теряет картинку
 * сегмента, поэтому адрес указан явно — обычным файлом, а не внутренним
 * маршрутом Next, который может поменяться с обновлением.
 */
export function ogImageUrl(): string {
  return `${siteUrl()}/og-image.png`;
}

const OG_IMAGE = { width: 1200, height: 630, alt: SITE_NAME };

export function openGraphFor(lang: Locale, path: string, title: string, description: string) {
  return {
    type: "website" as const,
    siteName: SITE_NAME,
    url: pageUrl(lang, path),
    title,
    description,
    locale: OG_LOCALE[lang],
    alternateLocale: LOCALES.filter((l) => l !== lang).map((l) => OG_LOCALE[l]),
    images: [{ url: ogImageUrl(), ...OG_IMAGE }],
  };
}

export function twitterFor(title: string, description: string) {
  return {
    card: "summary_large_image" as const,
    title,
    description,
    images: [ogImageUrl()],
  };
}

/** Теги подтверждения владения; пустые переменные тегов не дают. */
export function verificationTags() {
  const google = process.env.GOOGLE_SITE_VERIFICATION?.trim();
  const yandex = process.env.YANDEX_VERIFICATION?.trim();

  if (!google && !yandex) {
    return undefined;
  }

  return {
    ...(google ? { google } : {}),
    ...(yandex ? { yandex } : {}),
  };
}

/** JSON для <script type="application/ld+json">: `<` экранируется. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export interface OrganizationInput {
  legalName: string;
  address: string;
  phone: string;
  email: string;
  googlePlay: string | null;
}

export function organizationJsonLd(input: OrganizationInput) {
  const site = siteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${site}/#organization`,
    name: SITE_NAME,
    legalName: input.legalName,
    url: site,
    logo: `${site}/brand/mytamga-logo.png`,
    address: input.address,
    telephone: input.phone,
    email: input.email,
    ...(input.googlePlay ? { sameAs: [input.googlePlay] } : {}),
  };
}

export function websiteJsonLd(lang: Locale) {
  const site = siteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${site}/#website`,
    name: SITE_NAME,
    url: site,
    inLanguage: HREFLANG[lang],
  };
}

export interface AppInput {
  googlePlay: string | null;
  /** Наибольшая цена тарифа в сумах; null — цены не показываем. */
  highPrice: number | null;
}

export function mobileApplicationJsonLd(input: AppInput) {
  return {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: SITE_NAME,
    operatingSystem: "ANDROID",
    applicationCategory: "BusinessApplication",
    ...(input.googlePlay ? { url: input.googlePlay, installUrl: input.googlePlay } : {}),
    ...(input.highPrice !== null && input.highPrice > 0
      ? {
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "UZS",
            lowPrice: 0,
            highPrice: input.highPrice,
          },
        }
      : {}),
  };
}

interface PricedPlan {
  priceMonthly: number;
  priceYearly: number | null;
  currency: string;
  isRequestOnly: boolean;
}

/** Наибольшая цена в сумах среди тарифов каталога; null, если цен нет. */
export function highestPlanPrice(plans: readonly PricedPlan[] | null): number | null {
  if (!plans) {
    return null;
  }

  const prices = plans
    .filter((plan) => !plan.isRequestOnly && plan.currency === "UZS")
    // Только месячные цены: годовая в разметке читалась бы как цена подписки.
    .map((plan) => plan.priceMonthly);
  const highest = Math.max(0, ...prices);

  return highest > 0 ? highest : null;
}
