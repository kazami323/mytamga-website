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
  | "pricesPending"
  // 409 на оплате: бессрочный тариф или уже оплачен другой отложенный.
  | "checkoutConflict";

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
 *
 * `badRequestCode` — что значит 400 на этой конкретной ручке. API отвечает 400
 * и на неверный SMS-код, и на тариф, который через кассу не продаётся: один
 * общий перевод сказал бы опечатавшемуся человеку «этот тариф оформляется по
 * заявке».
 */
export function errorCodeFor(
  status: number,
  badRequestCode: BillingErrorCode = "requestOnly",
  conflictCode: BillingErrorCode = "store",
): BillingErrorCode {
  if (status === 400) {
    return badRequestCode;
  }

  switch (status) {
    case 429:
      return "rate";
    case 403:
      return "forbidden";
    case 409:
      return conflictCode;
    case 503:
      return "unavailable";
    case 404:
      return "noOrganization";
    case 401:
      return "signedOut";
    default:
      return "network";
  }
}
