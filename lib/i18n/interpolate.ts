/**
 * Подстановка в строку словаря: `{amount}`, `{seconds}`, `{date}`.
 * Неизвестное место остаётся текстом — увидеть `{amount}` неприятно, но это
 * честная поломка, а `undefined` на странице тарифов выглядит как сбой сайта.
 */
export function fill(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}
