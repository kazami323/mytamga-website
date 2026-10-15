import type { BillingErrorCode } from "../api/errors.ts";
import type { SubscriptionView } from "./subscription.ts";

export const POLL_INTERVAL_MS = 3000;
export const POLL_DEADLINE_MS = 60_000;

/**
 * Состояние подписки до перехода в Click. Без него продление того же тарифа
 * выглядело бы оплаченным сразу: тариф уже тот, который ждём.
 */
export type PollBaseline = {
  effect: "extend" | "defer";
  planKey: string;
  endsAt: string | null;
  scheduledKey: string | null;
  scheduledUntil: string | null;
};

/** Имя куки, в которой страница оплаты оставляет исходное состояние для возврата. */
export const BASELINE_COOKIE = "mt_txb";

export function serializeBaseline(baseline: PollBaseline): string {
  return encodeURIComponent(JSON.stringify(baseline));
}

export function parseBaseline(raw: string | null | undefined): PollBaseline | null {
  if (!raw) {
    return null;
  }
  try {
    const value = JSON.parse(decodeURIComponent(raw)) as Record<string, unknown>;
    const text = (field: unknown) => (typeof field === "string" && field ? field : null);
    if ((value.effect !== "extend" && value.effect !== "defer") || !text(value.planKey)) {
      return null;
    }
    return {
      effect: value.effect,
      planKey: text(value.planKey) as string,
      endsAt: text(value.endsAt),
      scheduledKey: text(value.scheduledKey),
      scheduledUntil: text(value.scheduledUntil),
    };
  } catch {
    return null;
  }
}

/** Исходное состояние для эффектов, которые не меняют тариф или очередь заметно. */
export function baselineFor(
  effect: string | null,
  planKey: string,
  subscription: SubscriptionView | null,
): PollBaseline | null {
  if ((effect !== "extend" && effect !== "defer") || !subscription) {
    return null;
  }
  return {
    effect,
    planKey,
    endsAt: subscription.nextBillingAt,
    scheduledKey: subscription.scheduledPlan?.key ?? null,
    scheduledUntil: subscription.scheduledPlan?.until ?? null,
  };
}

function isLater(next: string | null | undefined, before: string | null): boolean {
  const a = next ? Date.parse(next) : Number.NaN;
  const b = before ? Date.parse(before) : Number.NaN;
  return Number.isFinite(a) && Number.isFinite(b) && a > b;
}

/**
 * Изменилось ли состояние так, как должна изменить его оплата. Без исходного
 * состояния сравнивать не с чем, и действует прежнее правило.
 */
function paymentApplied(
  subscription: SubscriptionView,
  expectedPlanKey: string,
  baseline: PollBaseline | null | undefined,
): boolean {
  if (!baseline || baseline.planKey !== expectedPlanKey) {
    return (
      subscription.planKey === expectedPlanKey ||
      subscription.scheduledPlan?.key === expectedPlanKey
    );
  }

  if (baseline.effect === "extend") {
    // Тот же тариф уже включён; оплата видна только по сдвинувшемуся сроку.
    // Нет исходного срока — честно сравнить нечем, и ждём подтверждения.
    return (
      subscription.planKey === expectedPlanKey &&
      isLater(subscription.nextBillingAt, baseline.endsAt)
    );
  }

  const scheduled = subscription.scheduledPlan;

  if (!scheduled || scheduled.key !== expectedPlanKey) {
    return false;
  }

  // Тот же отложенный тариф уже стоял в очереди — это повтор, и признак оплаты
  // один: его срок отодвинулся.
  return baseline.scheduledKey === expectedPlanKey
    ? isLater(scheduled.until, baseline.scheduledUntil)
    : true;
}

export type PollOutcome = "success" | "pending" | "signedOut" | "timeout";

/**
 * Что делать после очередного ответа сервера. Вынесено из компонента, потому
 * что именно здесь легко ошибиться: показать успех на бесплатном тарифе или
 * крутить опрос минуту, когда человеку надо просто войти заново.
 */
export function pollOutcome(input: {
  subscription?: SubscriptionView | null;
  code?: BillingErrorCode | null;
  elapsedMs: number;
  expectedPlanKey?: string | null;
  baseline?: PollBaseline | null;
}): PollOutcome {
  const { subscription, code, elapsedMs, expectedPlanKey, baseline } = input;

  if (subscription && subscription.status === "active") {
    // Оплаченный наперёд тариф текущим не становится — его видно в scheduledPlan.
    const isExpected = expectedPlanKey
      ? paymentApplied(subscription, expectedPlanKey, baseline)
      : subscription.planKey !== "basic";

    // Успех проверяется до времени: ответ мог прийти на последней секунде.
    if (isExpected) {
      return "success";
    }
  }

  if (code === "signedOut" || code === "noOrganization") {
    return "signedOut";
  }

  if (elapsedMs >= POLL_DEADLINE_MS) {
    return "timeout";
  }

  return "pending";
}
