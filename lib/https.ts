// Принудительный HTTPS для боевого адреса сайта.
//
// На хостинге (nginx + Passenger) Next видит в request.nextUrl внутренний адрес
// своего сервера, а не адрес из запроса, поэтому хост и схему берём из
// заголовков: Host (или X-Forwarded-Host) и X-Forwarded-Proto. Если хостинг
// схему не передаёт — ничего не делаем: тогда HTTPS обеспечивает настройка
// «Force HTTPS Redirect» в cPanel.
//
// Только для хоста из NEXT_PUBLIC_SITE_URL и только в production: localhost и
// предпросмотры не трогаются.

/** HSTS на 30 дней: если сертификат на хостинге однажды истечёт, браузеры не
 * заблокируют сайт надолго. Без includeSubDomains — у почты свои адреса. */
export const HSTS_VALUE = "max-age=2592000";

export type RequestOrigin = {
  /** Хост из запроса без порта, нижним регистром; "" — неизвестен. */
  host: string;
  /** "http" | "https", если хостинг передал X-Forwarded-Proto; иначе null. */
  proto: "http" | "https" | null;
};

function firstValue(header: string | null | undefined) {
  return (header ?? "").split(",")[0].trim();
}

/** Хост и схема запроса по заголовкам прокси. */
export function requestOrigin(headers: { get(name: string): string | null }): RequestOrigin {
  const rawHost = firstValue(headers.get("x-forwarded-host")) || firstValue(headers.get("host"));
  const host = rawHost.toLowerCase().replace(/:\d+$/, "");
  const rawProto = firstValue(headers.get("x-forwarded-proto")).toLowerCase();
  const proto = rawProto === "http" || rawProto === "https" ? rawProto : null;
  return { host, proto };
}

function siteHost(siteUrl: string | undefined) {
  try {
    return siteUrl ? new URL(siteUrl).host.toLowerCase() : "";
  } catch {
    return "";
  }
}

/** Куда перенаправить незащищённый запрос (путь и запрос — из url), или null. */
export function httpsRedirectTarget(
  url: URL,
  origin: RequestOrigin,
  siteUrl: string | undefined,
  isProduction: boolean,
): URL | null {
  const host = siteHost(siteUrl);
  if (!isProduction || !host || origin.host !== host || origin.proto !== "http") {
    return null;
  }
  // Путь присваивается явно, а не разбирается от базы: путь вида //evil.com
  // иначе превратился бы в чужой хост (открытый редирект).
  const target = new URL(`https://${host}`);
  target.pathname = url.pathname;
  target.search = url.search;
  return target.host === host ? target : null;
}

/** Ставить ли HSTS: только на защищённый запрос к боевому хосту. */
export function shouldSendHsts(origin: RequestOrigin, siteUrl: string | undefined, isProduction: boolean) {
  const host = siteHost(siteUrl);
  return isProduction && host !== "" && origin.host === host && origin.proto === "https";
}
