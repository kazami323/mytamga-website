// Дольше десяти минут называть в секундах бессмысленно: «повторите через 10800
// секунд» человек не переведёт в часы, и это выглядит как поломка.
const MAX_NAMEABLE_SECONDS = 600;

/**
 * Секунды до повторной попытки из тела ответа 429 (`{ error, retryAfterMs }`).
 * Заголовка `Retry-After` API не присылает.
 *
 * `null` — числа нет или называть его не стоит: страница скажет «попробуйте
 * позже». Это обычный случай, а не исключение.
 */
export function retryAfterSeconds(body: unknown): number | null {
  const raw =
    typeof body === "object" && body !== null
      ? (body as { retryAfterMs?: unknown }).retryAfterMs
      : undefined;

  if (typeof raw !== "number" || !Number.isFinite(raw) || raw <= 0) {
    // Числа нет — и выдумывать его нельзя. API на самом деле его не присылает:
    // guard кладёт `retryAfterMs` в тело, а глобальный фильтр исключений
    // (`apps/api/src/common/filters/api-exception.filter.ts`) переписывает тело
    // в `{ error, requestId }` и задержку теряет. Заголовка `Retry-After` тоже
    // нет. Сказать «повторите через 1 с», когда окно — минута в продакшене и
    // пятнадцать минут локально, значит соврать человеку на входе.
    return null;
  }

  const seconds = Math.ceil(raw / 1000);

  return seconds > MAX_NAMEABLE_SECONDS ? null : seconds;
}
