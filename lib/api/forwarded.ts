/**
 * Адрес клиента из цепочки прокси. Берём **левое** звено: правое — ближайший
 * прокси, то есть мы сами. Ошибка здесь незаметна и дорога: серверный лимит
 * входа начал бы считать всех посетителей как одного.
 */
export function clientIpFrom(
  forwardedFor: string | null,
  realIp?: string | null,
): string | null {
  const chain = String(forwardedFor ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (chain.length > 0) {
    return chain[0];
  }

  const direct = String(realIp ?? "").trim();

  return direct || null;
}
