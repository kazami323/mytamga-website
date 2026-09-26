/**
 * Сервер приложения знает только узбекские номера: `normalizePhone` там
 * оставляет цифры и требует двенадцать, начиная с 998. Поэтому проверяем здесь
 * и говорим человеку понятное, вместо того чтобы получить 400.
 */
export function toUzPhone(input: string): string | null {
  let digits = String(input ?? "").replace(/\D/g, "");

  // Международная запись 00998… — то же самое, что +998….
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  // Девять цифр — номер без кода страны, как его диктуют вслух.
  if (digits.length === 9) {
    digits = `998${digits}`;
  }

  if (digits.length !== 12 || !digits.startsWith("998")) {
    return null;
  }

  return digits;
}

/**
 * Код из SMS. API требует ровно шесть цифр (`verify-phone-code.dto.ts`), поэтому
 * пятизначный до него не доводим: иначе вернулся бы 400, а человек увидел бы
 * сообщение не про код.
 */
export function toVerificationCode(input: string): string | null {
  const digits = String(input ?? "").replace(/\D/g, "");

  return digits.length === 6 ? digits : null;
}
