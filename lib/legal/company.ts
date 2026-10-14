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

// Юридическое название и адрес — буква в букву как в записи D-U-N-S 933907274
// (Apple сверяет организацию с сайтом). Рядом допустим перевод формы для читателя.
export const DUNS_LEGAL_NAME = "MY TAMGA APP, MCHJ";
export const DUNS_ADDRESS = "Daryoboyi MFY, Daryoboyi 7-tor kochasi 18a, Tashkent, Tashkent City 100155";

const LEGAL_NAME: Localized = {
  ru: `${DUNS_LEGAL_NAME} (ООО)`,
  uz: DUNS_LEGAL_NAME,
  en: `${DUNS_LEGAL_NAME} (LLC)`,
};

const TAX_LABEL: Localized = {
  ru: "ИНН",
  uz: "STIR",
  en: "TIN",
};

// Адрес одинаков во всех языках: топонимы не переводим, чтобы строка совпадала с D-U-N-S.
const ADDRESS: Localized = {
  ru: DUNS_ADDRESS,
  uz: DUNS_ADDRESS,
  en: DUNS_ADDRESS,
};

/** Короткая форма совпадает с полной: другой записи адреса на сайте быть не должно. */
const SHORT_ADDRESS: Localized = ADDRESS;

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
