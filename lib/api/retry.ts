// Дольше десяти минут называть в секундах бессмысленно: «повторите через 10800
// секунд» человек не переведёт в часы, и это выглядит как поломка.
const MAX_NAMEABLE_SECONDS = 600;

/**
 * Секунды до повторной попытки из тела ответа 429 (`{ error, retryAfterMs }`).
 * Заголовка `Retry-After` API не присылает.
 *
 * `null` — задержка есть, но называть её числом не стоит: страница скажет
 * «попробуйте позже».
 */
export function retryAfterSeconds(body: unknown): number | null {
  const raw =
    typeof body === "object" && body !== null
      ? (body as { retryAfterMs?: unknown }).retryAfterMs
      : undefined;

  if (typeof raw !== "number" || !Number.isFinite(raw) || raw <= 0) {
    // Сервер отказал — значит подождать надо, даже если не сказал сколько.
    return 1;
  }

  const seconds = Math.ceil(raw / 1000);

  return seconds > MAX_NAMEABLE_SECONDS ? null : seconds;
}
