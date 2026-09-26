/**
 * Единственное место, которое знает адрес API приложения. Переменная серверная,
 * без префикса NEXT_PUBLIC_: браузер в API не ходит вообще.
 *
 * `null`, а не исключение: страница тарифов должна честно сказать, что цены
 * недоступны, а не уронить сборку всего сайта.
 */
export function apiUrl(path: string): string | null {
  const base = String(process.env.MYTAMGA_API_URL ?? "").trim();

  if (!base) {
    return null;
  }

  return `${base.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}
