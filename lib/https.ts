// Принудительный HTTPS для боевого адреса сайта. Перед сайтом на хостинге стоит
// nginx с Passenger, и Next видит настоящую схему запроса, поэтому `http:`
// здесь значит, что посетитель пришёл по незащищённому адресу.
//
// Только для хоста из NEXT_PUBLIC_SITE_URL и только в production: localhost и
// предпросмотры не трогаются.

/** HSTS на 30 дней: если сертификат на хостинге однажды истечёт, браузеры не
 * заблокируют сайт надолго. Без includeSubDomains — у почты свои адреса. */
export const HSTS_VALUE = "max-age=2592000";

function siteHost(siteUrl: string | undefined) {
  try {
    return siteUrl ? new URL(siteUrl).host : "";
  } catch {
    return "";
  }
}

/** Куда перенаправить незащищённый запрос, или null — оставить как есть. */
export function httpsRedirectTarget(
  url: URL,
  siteUrl: string | undefined,
  isProduction: boolean,
): URL | null {
  const host = siteHost(siteUrl);
  if (!isProduction || !host || url.host !== host || url.protocol !== "http:") {
    return null;
  }
  const target = new URL(url.toString());
  target.protocol = "https:";
  return target;
}

/** Ставить ли HSTS на ответ: только для защищённого запроса к боевому хосту. */
export function shouldSendHsts(url: URL, siteUrl: string | undefined, isProduction: boolean) {
  const host = siteHost(siteUrl);
  return isProduction && host !== "" && url.host === host && url.protocol === "https:";
}
