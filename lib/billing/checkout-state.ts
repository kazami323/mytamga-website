import type { SubscriptionView } from "./subscription.ts";

/** Причина, по которой оплаты не будет. `null` — оплата доступна. */
export type CheckoutBlock =
  | "storeManaged"
  | "ownerOnly"
  | "freePlan"
  | "requestOnly"
  | "pricesPending"
  | "noProvider"
  | null;

/** Выбранный тариф — ровно то, что нужно знать о нём кассе. */
export type SelectedPlan = {
  key: string;
  isRequestOnly: boolean;
  priceMonthly: number;
};

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
  plan: SelectedPlan | null;
  /** Какие тарифы касса вообще оформляет — см. CHECKOUT_SELLABLE_PLAN_KEYS. */
  sellablePlanKeys: readonly string[];
}): CheckoutActions {
  const { pricesPublished, subscription, onlineProviders, plan, sellablePlanKeys } = input;

  // По заявке — и тариф, помеченный так в каталоге, и тот, который касса не
  // продаёт: для человека это одно и то же, а отказ после нажатия — нет.
  const isByRequest = plan !== null && (plan.isRequestOnly || !sellablePlanKeys.includes(plan.key));

  // Подписка магазина запирает кассу только пока она действует: 409 сервер
  // отдаёт по активной, а по истёкшей продал бы.
  const block: CheckoutBlock =
    subscription?.isStoreManaged && subscription.status === "active"
      ? "storeManaged"
      : subscription && !subscription.canManageSubscription
        ? "ownerOnly"
        // Про сам тариф правда важнее общего состояния сервиса: бесплатный
        // уже включён, а по заявке касса его не оформит — Click отвергает
        // всё, кроме Pro, и отказ пришёл бы уже после нажатия.
        : plan && plan.priceMonthly === 0 && !plan.isRequestOnly
          ? "freePlan"
          : isByRequest
            ? "requestOnly"
            : !pricesPublished
              ? "pricesPending"
              : onlineProviders === 0
                ? "noProvider"
                : null;

  return {
    block,
    // До входа подписки нет, а без выбранного тарифа платить не за что.
    canPay: block === null && subscription !== null && plan !== null,
    canRequest: block !== null && subscription?.canRequestUpgrade === true,
  };
}
