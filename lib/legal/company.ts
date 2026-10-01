import type { Locale } from "../i18n/config.ts";

/**
 * Реквизиты компании — единственное место, где они записаны. Отсюда их берут
 * юридические страницы, контакты на главной и строка в подвале, поэтому
 * поправка после сверки со свидетельством о регистрации делается здесь и
 * больше нигде.
 *
 * Их требует Click при подключении мерчанта: он проверяет сайт и ждёт оферту,
 * цены, реквизиты и контакты.
 *
 * REVIEW(legal): организационно-правовую форму и написание адреса владелец
 * сверит со свидетельством о регистрации.
 */

type RegistrationLocale = "ru" | "uz" | "en";

type Localized = Record<RegistrationLocale, string>;

const LEGAL_NAME: Localized = {
  ru: "ООО «MY TAMGA APP»",
  uz: '"MY TAMGA APP" MChJ',
  en: "MY TAMGA APP LLC",
};

const TAX_LABEL: Localized = {
  ru: "ИНН",
  uz: "STIR",
  en: "TIN",
};

// Узбекский — через U+2018, а не U+02BB: в Manrope нет глифа для U+02BB, и
// браузер рисовал бы знак системным шрифтом. Так же, как во всех словарях.
const ADDRESS: Localized = {
  ru: "Республика Узбекистан, г. Ташкент, Сергелийский район, МСГ «Дарёбуйи», 7-й тупик Дарёбуйи, дом 18А",
  uz: "O‘zbekiston Respublikasi, Toshkent sh., Sergeli tumani, Daryobo‘yi MFY, Daryobo‘yi 7-tor ko‘chasi, 18A-uy",
  en: "18A, 7th Daryobo'yi Lane, Daryobo'yi Mahalla, Sergeli District, Tashkent, Uzbekistan",
};

/** Короткая форма — для контактов на главной и строки в подвале. */
const SHORT_ADDRESS: Localized = {
  ru: "Ташкент, Сергелийский район, Дарёбуйи, 7-й тупик, 18А",
  uz: "Toshkent, Sergeli tumani, Daryobo‘yi 7-tor ko‘chasi, 18A",
  en: "18A, 7th Daryobo'yi Lane, Sergeli District, Tashkent",
};

export const COMPANY = {
  legalName: LEGAL_NAME,
  taxId: "313333116",
  address: ADDRESS,
  phone: "+998 91 572 05 09",
  /** Настоящий: он указан в политике и условиях приложения. */
  supportEmail: "support@mytamga.uz",
} as const;

const PHONE_HREF = "tel:+998915720509";

const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=Toshkent+Sergeli+Daryobo%CA%BByi+7-tor+ko%CA%BBchasi+18A";

const REQUIRED = ["legalName", "taxId", "address", "phone"] as const;

/** Имена незаполненных полей. Пустой список — реквизиты готовы. */
export function missingCompanyFields(): string[] {
  return REQUIRED.filter((field) => !COMPANY[field]);
}

/**
 * Китайской формы регистрационных данных нет: это юридические идентификаторы,
 * и самодельная передача хуже английской формы, которую дал владелец.
 */
function registrationLocale(locale: Locale): RegistrationLocale {
  return locale === "zh" ? "en" : locale;
}

/** Реквизиты в форме языка страницы. */
export function companyFor(locale: Locale) {
  const form = registrationLocale(locale);

  return {
    legalName: LEGAL_NAME[form],
    taxLabel: TAX_LABEL[form],
    taxId: COMPANY.taxId,
    address: ADDRESS[form],
    shortAddress: SHORT_ADDRESS[form],
    phone: COMPANY.phone,
    phoneHref: PHONE_HREF,
    mapsUrl: MAPS_URL,
    supportEmail: COMPANY.supportEmail,
  };
}

/** Строка подвала: юрлицо · ИНН · адрес. Год ставит подвал, чтобы не устаревал. */
export function companyLine(locale: Locale): string {
  const company = companyFor(locale);

  return `${company.legalName} · ${company.taxLabel} ${company.taxId} · ${company.shortAddress}`;
}
