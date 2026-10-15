export type BillingPeriod = "monthly" | "yearly";

/** Что оплата сделает с действующей подпиской (поле `effect` ответа сервера). */
export type CheckoutEffect = "new" | "extend" | "upgrade" | "defer";

export type CheckoutOffer = {
  url: string;
  transactionId: string;
  billingPeriod: BillingPeriod | null;
  amount: number | null;
  /** `null` — старый сервер, который effect ещё не отдаёт. */
  effect: CheckoutEffect | null;
};

const EFFECTS = new Set<string>(["new", "extend", "upgrade", "defer"]);

export function normalizePeriod(value: unknown): BillingPeriod {
  return value === "yearly" ? "yearly" : "monthly";
}

/**
 * Ответ создания оплаты. Новые поля необязательны: сайт обязан работать и со
 * старым сервером, где есть только адрес и номер платежа.
 */
export function parseCheckout(data: unknown): CheckoutOffer | null {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return null;
  }
  const record = data as Record<string, unknown>;
  const url = typeof record.url === "string" ? record.url : "";

  if (!url) {
    return null;
  }

  return {
    url,
    transactionId: typeof record.transactionId === "string" ? record.transactionId : "",
    billingPeriod:
      record.billingPeriod === "monthly" || record.billingPeriod === "yearly"
        ? record.billingPeriod
        : null,
    amount:
      typeof record.amount === "number" && Number.isFinite(record.amount) && record.amount > 0
        ? record.amount
        : null,
    effect:
      typeof record.effect === "string" && EFFECTS.has(record.effect)
        ? (record.effect as CheckoutEffect)
        : null,
  };
}

/** Есть что объяснить человеку до перехода в Click. */
export function effectNeedsConfirmation(offer: CheckoutOffer): boolean {
  return offer.effect !== null;
}

/** Срок оплаты на сервере: месяц — 30 дней, год — 365. */
export const PERIOD_DAYS = { monthly: 30, yearly: 365 } as const;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * До какой даты продлится доступ — только там, где её можно назвать честно:
 * при новом тарифе и продлении срок складывается из известных чисел. При
 * повышении остаток пересчитывается в дни по цене, а при отложенном тарифе
 * дата начала — конец текущего: точную дату называть нечем.
 */
export function effectEndsAt(input: {
  effect: CheckoutEffect | null;
  period: BillingPeriod;
  currentEnd: string | null;
  now: number;
}): Date | null {
  const { effect, period, currentEnd, now } = input;
  const duration = PERIOD_DAYS[period] * DAY_MS;

  if (effect === "new") {
    return new Date(now + duration);
  }

  if (effect === "extend" && currentEnd) {
    const end = new Date(currentEnd).getTime();
    return Number.isFinite(end) ? new Date(end + duration) : null;
  }

  return null;
}
