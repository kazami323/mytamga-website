/** Код сообщения, а не текст: слова берёт словарь страницы. */
export type BillingErrorCode =
  // Приходят от API.
  | "rate"
  | "forbidden"
  | "store"
  | "unavailable"
  | "requestOnly"
  | "noOrganization"
  | "signedOut"
  | "network"
  // Наши собственные проверки, до обращения к API.
  | "phoneInvalid"
  | "codeInvalid"
  | "pricesPending";

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(`API responded ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/**
 * Русский текст ошибки от сервера на китайскую страницу не попадает: он уходит
 * в лог, а человек видит перевод по коду.
 */
export function errorCodeFor(status: number): BillingErrorCode {
  switch (status) {
    case 429:
      return "rate";
    case 403:
      return "forbidden";
    case 409:
      return "store";
    case 503:
      return "unavailable";
    case 400:
      return "requestOnly";
    case 404:
      return "noOrganization";
    case 401:
      return "signedOut";
    default:
      return "network";
  }
}
