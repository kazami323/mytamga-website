/**
 * Реквизиты компании. `null` — значения ещё нет, и это видно программно:
 * проверка перед запуском не должна зависеть от того, что кто-то перечитал файл.
 *
 * Их требует Click при подключении мерчанта: он проверяет сайт и ждёт оферту,
 * цены, реквизиты и контакты.
 */
export const COMPANY = {
  /** REVIEW(legal): название юридического лица — ждём от владельца. */
  legalName: null as string | null,
  /** REVIEW(legal): ИНН. */
  taxId: null as string | null,
  /** REVIEW(legal): юридический адрес. */
  address: null as string | null,
  /** REVIEW(legal): телефон для договора и для Click. */
  phone: null as string | null,
  /** Настоящий: он указан в политике и условиях приложения. */
  supportEmail: "support@mytamga.uz",
} as const;

const REQUIRED = ["legalName", "taxId", "address", "phone"] as const;

/** Имена незаполненных полей. Пустой список — реквизиты готовы. */
export function missingCompanyFields(): string[] {
  return REQUIRED.filter((field) => !COMPANY[field]);
}
