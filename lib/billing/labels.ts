export type LabelMap = Record<string, string>;

/**
 * Подпись возможности или лимита. Каталог знает только русский, поэтому
 * русская страница обходится без карты, а остальные языки переводят по
 * стабильному ключу (`ai_check`, `team_seats`).
 *
 * Порядок отката именно такой: карта языка, затем русская подпись из API,
 * затем сам ключ. Пустая строка в списке возможностей выглядит как поломка.
 */
export function labelFor(
  map: LabelMap | undefined,
  key: string,
  apiLabel: string,
): string {
  const translated = map?.[key]?.trim();

  if (translated) {
    return translated;
  }

  return apiLabel.trim() || key;
}
