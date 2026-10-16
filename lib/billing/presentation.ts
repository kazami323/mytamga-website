import type { BillingPlan, PlanLimit } from "./catalog.ts";

/**
 * Подача тарифов: что показать в карточке и в таблице лимитов. Только чистые
 * функции от каталога, без разметки и без строк словаря.
 */

/** Не выводится отдельной строкой: смысл несёт строка «Команда из N человек». */
export const HIDDEN_FEATURE_KEYS: readonly string[] = ["declarant_team"];

/** Порядок строк таблицы. Незнакомые лимиты каталога встают после этих. */
export const LIMIT_ORDER: readonly string[] = [
  "calculations_per_month",
  "active_cases",
  "cases_per_month",
  "pdf_exports_per_month",
  "ai_checks_per_month",
  "team_seats",
];

/** У тарифа по заявке эти значения оговариваются договором, а не числом. */
export const CONTRACT_LIMIT_KEYS: readonly string[] = [
  "ai_checks_per_month",
  "team_seats",
];

/**
 * Ключи возможностей, которые тариф получает сверх предыдущего. Для первого
 * тарифа (`previous === null`) — все его возможности. Порядок — как в каталоге.
 */
export function newFeatureKeys(
  plan: BillingPlan,
  previous: BillingPlan | null,
): string[] {
  const had = new Set(previous?.features.map((feature) => feature.key) ?? []);

  return plan.features
    .map((feature) => feature.key)
    .filter((key) => !had.has(key) && !HIDDEN_FEATURE_KEYS.includes(key));
}

/**
 * Число человек для строки «Команда из N человек» — только если команда выросла
 * относительно предыдущего тарифа. У первого тарифа и там, где вырасти нечему,
 * строки нет.
 */
export function teamLineCount(
  plan: BillingPlan,
  previous: BillingPlan | null,
): number | null {
  if (previous === null || plan.seatsIncluded === null) {
    return null;
  }

  const before = Math.max(previous.seatsIncluded ?? 1, 1);

  return plan.seatsIncluded > before ? plan.seatsIncluded : null;
}

export type LimitCell =
  | { kind: "number"; value: number }
  | { kind: "none" }
  | { kind: "unlimited" }
  | { kind: "contract" };

/** Значение лимита для ячейки таблицы. `limit === undefined` — тариф его не задаёт. */
export function limitCell(
  plan: Pick<BillingPlan, "isRequestOnly">,
  key: string,
  limit: PlanLimit | undefined,
): LimitCell {
  if (plan.isRequestOnly && CONTRACT_LIMIT_KEYS.includes(key)) {
    return { kind: "contract" };
  }
  if (!limit) {
    return { kind: "none" };
  }
  if (limit.unlimited) {
    return { kind: "unlimited" };
  }
  if (limit.value <= 0) {
    return { kind: "none" };
  }

  return { kind: "number", value: limit.value };
}

/** Строки таблицы: известные лимиты в нужном порядке, затем новые из каталога. */
export function limitRows(
  plans: BillingPlan[],
): { key: string; apiLabel: string }[] {
  const seen = new Map<string, string>();

  for (const plan of plans) {
    for (const limit of plan.limits) {
      if (!seen.has(limit.key) || !seen.get(limit.key)) {
        seen.set(limit.key, limit.label);
      }
    }
  }

  const known = LIMIT_ORDER.filter((key) => seen.has(key));
  const extra = [...seen.keys()].filter((key) => !LIMIT_ORDER.includes(key));

  return [...known, ...extra].map((key) => ({
    key,
    apiLabel: seen.get(key) ?? "",
  }));
}

export type PluralForms = {
  one: string;
  few: string;
  many: string;
  other: string;
};

/** Форма слова по числу; недостающую форму заменяет `other`. */
export function pluralize(
  locale: string,
  count: number,
  forms: PluralForms,
): string {
  const category = new Intl.PluralRules(locale).select(count) as string;
  const form = (forms as Record<string, string>)[category];

  return form || forms.other;
}
