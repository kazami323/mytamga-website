/**
 * Защита от запроса с чужой страницы. Вместе с `SameSite=lax` этого хватает:
 * браузер не отправит наши куки в межсайтовом POST, а запрос без `Origin`
 * пришёл не из браузера.
 */
export function isSameOrigin(origin: string | null, host: string | null): boolean {
  if (!origin || !host || origin === "null") {
    return false;
  }

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
