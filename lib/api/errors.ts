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
  | "checkoutConflict"
  // Три разных 409 кассы: сервер объясняет каждый своим текстом.
  | "checkoutPerpetual"
  | "checkoutScheduled";

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

/**
 * Три разных 409 на оплате. Сервер объясняет каждый своим русским текстом, но
 * показывать его как есть нельзя: страница бывает на uz, en и zh. Поэтому
 * известный текст опознаётся и заменяется переводом, а неизвестный (сервер мог
 * измениться) получает общее объяснение.
 *
 * `detail` — название уже оплаченного отложенного тарифа. Это слово из
 * каталога сервера; пропускаем только короткие буквы и цифры.
 */
export function checkoutConflictFrom(body: unknown): {
  code: BillingErrorCode;
  detail: string | null;
} {
  const message =
    typeof body === "object" && body !== null && "message" in body
      ? (body as { message: unknown }).message
      : null;
  const text = (Array.isArray(message) ? message.join(" ") : String(message ?? "")).trim();

  if (text.startsWith("Подписка организации оформлена через App Store")) {
    return { code: "store", detail: null };
  }

  if (text.startsWith("Тариф организации действует бессрочно")) {
    return { code: "checkoutPerpetual", detail: null };
  }

  const scheduled = /^После текущего тарифа уже оплачен тариф ([^.]{1,40})\. /u.exec(text);

  if (scheduled) {
    const label = scheduled[1].trim();
    return /^[\p{L}\p{N} ]+$/u.test(label)
      ? { code: "checkoutScheduled", detail: label }
      : { code: "checkoutScheduled", detail: null };
  }

  return { code: "checkoutConflict", detail: null };
}
