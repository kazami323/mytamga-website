import type { SubscriptionView } from "./subscription.ts";

/** Причина, по которой оплаты не будет. `null` — оплата доступна. */
export type CheckoutBlock =
  | "storeManaged"
  | "ownerOnly"
  | "pricesPending"
  | "noProvider"
  | null;

export type CheckoutActions = {
  block: CheckoutBlock;
  canPay: boolean;
  canRequest: boolean;
};

/**
 * Что панель предлагает человеку и почему. Вынесено из компонента, потому что
 * здесь легко привести в тупик: право оплатить и право попросить — разные, и у
 * владельца организации второго нет. Кнопка «Запросить» для него закончилась бы
 * отказом 403.
 *
 * Порядок причин: сначала то, что относится лично к этому человеку, потом общее
 * состояние сервиса.
 */
export function checkoutActions(input: {
  pricesPublished: boolean;
  subscription: SubscriptionView | null;
  onlineProviders: number;
}): CheckoutActions {
  const { pricesPublished, subscription, onlineProviders } = input;

  const block: CheckoutBlock = subscription?.isStoreManaged
    ? "storeManaged"
    : subscription && !subscription.canManageSubscription
      ? "ownerOnly"
      : !pricesPublished
        ? "pricesPending"
        : onlineProviders === 0
          ? "noProvider"
          : null;

  return {
    block,
    // До входа подписки нет, и предлагать нечего.
    canPay: block === null && subscription !== null,
    canRequest: block !== null && subscription?.canRequestUpgrade === true,
  };
}
