export type PlanFeature = { key: string; label: string };

export type PlanLimit = {
  key: string;
  label: string;
  value: number;
  unlimited: boolean;
};

export type BillingPlan = {
  key: string;
  label: string;
  description: string;
  priceMonthly: number;
  priceYearly: number | null;
  priceMonthlyFrom: number | null;
  currency: string;
  trialDays: number;
  seatsIncluded: number | null;
  extraSeatPriceMonthly: number | null;
  isRequestOnly: boolean;
  features: PlanFeature[];
  limits: PlanLimit[];
};

export type BillingProvider = {
  key: string;
  label: string;
  status: "active" | "manual" | "not_connected";
  online: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseFeatures(value: unknown): PlanFeature[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!isRecord(entry) || !str(entry.key)) {
      return [];
    }
    return [{ key: str(entry.key), label: str(entry.label) }];
  });
}

function parseLimits(value: unknown): PlanLimit[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!isRecord(entry) || !str(entry.key)) {
      return [];
    }
    const amount = num(entry.value);
    return [
      {
        key: str(entry.key),
        label: str(entry.label),
        value: amount ?? 0,
        unlimited: entry.unlimited === true,
      },
    ];
  });
}

function parsePlan(value: unknown): BillingPlan | null {
  if (!isRecord(value)) {
    return null;
  }

  const key = str(value.key);
  const priceMonthly = num(value.priceMonthly);

  // Тариф без ключа или без месячной цены бесполезен: по ключу мы выбираем
  // подписи и кнопку, по цене — что показать. Лучше потерять один, чем
  // отрисовать карточку без имени.
  if (!key || priceMonthly === null) {
    return null;
  }

  return {
    key,
    label: str(value.label, key),
    description: str(value.description),
    priceMonthly,
    priceYearly: num(value.priceYearly),
    priceMonthlyFrom: num(value.priceMonthlyFrom),
    currency: str(value.currency, "UZS"),
    trialDays: num(value.trialDays) ?? 0,
    seatsIncluded: num(value.seatsIncluded),
    extraSeatPriceMonthly: num(value.extraSeatPriceMonthly),
    isRequestOnly: value.isRequestOnly === true,
    features: parseFeatures(value.features),
    limits: parseLimits(value.limits),
  };
}

/**
 * `null` — ответ структурно не наш: страница покажет «цены недоступны».
 * Пустой массив — каталог честно пуст, это другое состояние.
 */
export function parsePlans(input: unknown): BillingPlan[] | null {
  if (!isRecord(input) || !Array.isArray(input.plans)) {
    return null;
  }

  return sortPlans(
    input.plans.flatMap((entry) => {
      const plan = parsePlan(entry);
      return plan ? [plan] : [];
    }),
  );
}

/**
 * Порядок карточек: бесплатный, платные по возрастанию месячной цены, тариф по
 * заявке последним. Сервер порядок обещает, но страница не должна на него
 * полагаться: перепутанные карточки выглядят как ошибка в ценах.
 */
export function sortPlans(plans: BillingPlan[]): BillingPlan[] {
  const rank = (plan: BillingPlan) =>
    plan.isRequestOnly ? 2 : plan.priceMonthly === 0 ? 0 : 1;

  return plans
    .map((plan, index) => ({ plan, index }))
    .sort(
      (a, b) =>
        rank(a.plan) - rank(b.plan) ||
        a.plan.priceMonthly - b.plan.priceMonthly ||
        a.index - b.index,
    )
    .map((entry) => entry.plan);
}

/** Цена за период из каталога. `null` — бесплатный, по заявке или без годовой цены. */
export function planPrice(plan: BillingPlan, period: "monthly" | "yearly"): number | null {
  if (plan.isRequestOnly) {
    return null;
  }
  const value = period === "yearly" ? plan.priceYearly : plan.priceMonthly;
  return value !== null && value > 0 ? value : null;
}

/** Сколько человек экономит, платя за год, а не за двенадцать месяцев. */
export function yearlySaving(plan: BillingPlan): number | null {
  const yearly = planPrice(plan, "yearly");
  const monthly = planPrice(plan, "monthly");
  if (yearly === null || monthly === null) {
    return null;
  }
  const saving = monthly * 12 - yearly;
  return saving > 0 ? saving : null;
}

const PROVIDER_STATUSES = new Set(["active", "manual", "not_connected"]);

export function parseProviders(input: unknown): BillingProvider[] | null {
  if (!isRecord(input) || !Array.isArray(input.providers)) {
    return null;
  }

  return input.providers.flatMap((entry) => {
    // Нужны и ключ, и название. Провайдера без названия показать человеку
    // нечем, а подставить ключ значит вывести «payme» латиницей на китайской
    // странице. Реестр на сервере названия задаёт всегда.
    if (!isRecord(entry) || !str(entry.key) || !str(entry.label)) {
      return [];
    }
    const status = str(entry.status, "not_connected");
    return [
      {
        key: str(entry.key),
        label: str(entry.label),
        status: (PROVIDER_STATUSES.has(status)
          ? status
          : "not_connected") as BillingProvider["status"],
        online: entry.online === true,
      },
    ];
  });
}

/**
 * Есть ли что показывать. `null` — ответ не наш, пустой список — в каталоге
 * ничего публичного: для страницы это одно и то же состояние, потому что пустая
 * сетка без объяснения выглядит как поломка вёрстки.
 */
export function isCatalogUsable(plans: BillingPlan[] | null): boolean {
  return plans !== null && plans.length > 0;
}

/**
 * Что показывать в кассе: подключённое и не скрытое. Реестру мы верим в том,
 * подключён ли провайдер, но не в том, годится ли он нам.
 */
export function offerableProviders(
  providers: BillingProvider[],
  hidden: readonly string[],
): BillingProvider[] {
  return providers.filter((provider) => provider.online && !hidden.includes(provider.key));
}
