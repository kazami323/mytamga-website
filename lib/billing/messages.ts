import type { BillingErrorCode } from "../api/errors.ts";

type ErrorStrings = Record<string, string>;

/**
 * Код отказа в предложение на языке страницы. Русский текст сервера сюда не
 * попадает: он остаётся в логе, а человек читает свой язык.
 */
export function messageFor(
  code: BillingErrorCode,
  retryAfter: number | null | undefined,
  strings: ErrorStrings,
  detail?: string | null,
): string {
  if (code === "rate") {
    // Задержку длиннее десяти минут не называют в секундах.
    return typeof retryAfter === "number"
      ? strings.rate.replace("{seconds}", String(retryAfter))
      : strings.rateLater;
  }

  const text = strings[code] ?? strings.network;

  // ({plan}) — название тарифа из ответа сервера; без него фраза читается и так.
  return detail
    ? text.replace(/\{plan\}/g, detail)
    : text.replace(/\s*[(（]\{plan\}[)）]/g, "");
}
