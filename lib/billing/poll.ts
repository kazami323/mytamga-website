import type { BillingErrorCode } from "../api/errors.ts";
import type { SubscriptionView } from "./subscription.ts";

export const POLL_INTERVAL_MS = 3000;
export const POLL_DEADLINE_MS = 60_000;

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
}): PollOutcome {
  const { subscription, code, elapsedMs, expectedPlanKey } = input;

  if (subscription && subscription.status === "active") {
    const isExpected = expectedPlanKey
      ? subscription.planKey === expectedPlanKey
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
