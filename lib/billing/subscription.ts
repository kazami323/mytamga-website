export type SubscriptionSource = "site" | "appStore" | "playStore" | "other";

export type SubscriptionView = {
  planKey: string;
  planLabel: string;
  status: "active" | "trial" | "expired";
  source: SubscriptionSource;
  isStoreManaged: boolean;
  nextBillingAt: string | null;
  canManageSubscription: boolean;
  organizationName: string | null;
  seatsPurchased: number | null;
  seatsUsed: number | null;
};

// Метки источника, которыми сервер помечает подписку.
const SOURCES: Record<string, SubscriptionSource> = {
  click_paid: "site",
  app_store: "appStore",
  play_store: "playStore",
};

const STATUSES = new Set(["active", "trial", "expired"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseSubscription(input: unknown): SubscriptionView | null {
  if (!isRecord(input) || !isRecord(input.plan)) {
    return null;
  }

  const planKey = typeof input.plan.key === "string" ? input.plan.key : "";

  if (!planKey) {
    return null;
  }

  const rawStatus = typeof input.status === "string" ? input.status : "";
  const marker = typeof input.stripeStatus === "string" ? input.stripeStatus : "";
  const source = SOURCES[marker] ?? "other";
  const permissions = isRecord(input.billingPermissions) ? input.billingPermissions : {};
  const organization = isRecord(input.organization) ? input.organization : {};

  return {
    planKey,
    planLabel: typeof input.plan.label === "string" ? input.plan.label : planKey,
    // Неизвестный статус — «истёк»: ошибаться надо в сторону закрытого доступа.
    status: (STATUSES.has(rawStatus) ? rawStatus : "expired") as SubscriptionView["status"],
    source,
    isStoreManaged: source === "appStore" || source === "playStore",
    nextBillingAt:
      typeof input.nextBillingAt === "string" && input.nextBillingAt
        ? input.nextBillingAt
        : null,
    canManageSubscription: permissions.canManageSubscription === true,
    organizationName: typeof organization.name === "string" ? organization.name : null,
    seatsPurchased: typeof input.seatsPurchased === "number" ? input.seatsPurchased : null,
    seatsUsed: typeof input.seatsUsed === "number" ? input.seatsUsed : null,
  };
}
