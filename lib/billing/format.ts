// U+202F. Тот же разделитель разрядов, что в приложении: обычный пробел рвёт
// сумму на переносе, а точка читается как дробная часть.
const NARROW_NO_BREAK_SPACE = " ";

/** Разряды суммы, без названия валюты: слово подставляет словарь. */
export function groupDigits(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  const digits = String(Math.abs(rounded));
  const groups: string[] = [];

  for (let end = digits.length; end > 0; end -= 3) {
    groups.unshift(digits.slice(Math.max(0, end - 3), end));
  }

  return sign + groups.join(NARROW_NO_BREAK_SPACE);
}

/**
 * Сколько месячных платежей стоит год. Считается из каталога, а не вписывается:
 * выгода «два месяца в подарок» должна меняться вместе с ценами.
 * `null` — когда сравнивать нечего: бесплатный тариф или год не предлагается.
 */
export function yearlyMonths(
  priceMonthly: number,
  priceYearly: number,
): number | null {
  if (priceMonthly <= 0 || priceYearly <= 0) {
    return null;
  }

  return Math.round(priceYearly / priceMonthly);
}
