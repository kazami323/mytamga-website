import { test } from "node:test";
import assert from "node:assert/strict";

import type { BillingPlan } from "../lib/billing/catalog.ts";
import { FEATURE_LABELS, LIMIT_LABELS, PLAN_DESCRIPTIONS } from "../lib/billing/label-maps.ts";
import {
  limitCell,
  limitRows,
  newFeatureKeys,
  pluralize,
  teamLineCount,
} from "../lib/billing/presentation.ts";
import { ru } from "../lib/i18n/dictionaries/ru.ts";

function plan(over: Partial<Omit<BillingPlan, "features">> & { features?: string[] }): BillingPlan {
  const { features = [], ...rest } = over;
  return {
    key: "x",
    label: "X",
    description: "",
    priceMonthly: 1,
    priceYearly: null,
    priceMonthlyFrom: null,
    currency: "UZS",
    trialDays: 0,
    seatsIncluded: 1,
    extraSeatPriceMonthly: null,
    isRequestOnly: false,
    features: features.map((key) => ({ key, label: key })),
    limits: [],
    ...rest,
  };
}

test("первый тариф: новые возможности — все его возможности", () => {
  assert.deepEqual(newFeatureKeys(plan({ features: ["a", "b"] }), null), ["a", "b"]);
});

test("следующий тариф: только разница с предыдущим, в порядке каталога", () => {
  const prev = plan({ features: ["a", "b"] });
  const next = plan({ features: ["a", "c", "b", "d"] });
  assert.deepEqual(newFeatureKeys(next, prev), ["c", "d"]);
});

test("declarant_team отдельной строкой не выводится", () => {
  const prev = plan({ features: ["a"] });
  const next = plan({ features: ["a", "declarant_team", "b"] });
  assert.deepEqual(newFeatureKeys(next, prev), ["b"]);
});

test("строка команды: только если места выросли относительно предыдущего", () => {
  const one = plan({ seatsIncluded: 1 });
  const two = plan({ seatsIncluded: 2 });
  assert.equal(teamLineCount(one, null), null);
  assert.equal(teamLineCount(two, one), 2);
  assert.equal(teamLineCount(plan({ seatsIncluded: 2 }), two), null);
  assert.equal(teamLineCount(plan({ seatsIncluded: null }), two), null);
  assert.equal(teamLineCount(plan({ seatsIncluded: 5 }), plan({ seatsIncluded: null })), 5);
});

test("значение лимита: 0, безлимит, число, по договору", () => {
  const regular = { isRequestOnly: false };
  const vip = { isRequestOnly: true };
  const lim = (value: number, unlimited = false) => ({ key: "k", label: "", value, unlimited });

  assert.deepEqual(limitCell(regular, "calculations_per_month", lim(0)), { kind: "none" });
  assert.deepEqual(limitCell(regular, "calculations_per_month", lim(0, true)), { kind: "unlimited" });
  assert.deepEqual(limitCell(regular, "calculations_per_month", lim(30)), { kind: "number", value: 30 });
  assert.deepEqual(limitCell(regular, "calculations_per_month", undefined), { kind: "none" });
  assert.deepEqual(limitCell(vip, "ai_checks_per_month", lim(0, true)), { kind: "contract" });
  assert.deepEqual(limitCell(vip, "team_seats", lim(50)), { kind: "contract" });
  assert.deepEqual(limitCell(vip, "calculations_per_month", lim(0, true)), { kind: "unlimited" });
});

test("строки таблицы: известный порядок, затем незнакомые лимиты", () => {
  const p = plan({
    limits: ["team_seats", "new_one", "calculations_per_month"].map((key) => ({
      key,
      label: key,
      value: 1,
      unlimited: false,
    })),
  });
  assert.deepEqual(
    limitRows([p]).map((r) => r.key),
    ["calculations_per_month", "team_seats", "new_one"],
  );
});

test("склонение: ru различает формы, en и zh — нет", () => {
  const forms = { one: "1", few: "2", many: "5", other: "o" };
  assert.equal(pluralize("ru", 1, forms), "1");
  assert.equal(pluralize("ru", 2, forms), "2");
  assert.equal(pluralize("ru", 15, forms), "5");
  assert.equal(pluralize("en", 5, forms), "o");
  assert.equal(pluralize("zh", 5, { ...forms, many: "" }), "o");
});

test("словарь ru: срок и команда склоняются", () => {
  assert.equal(pluralize("ru", 7, ru.billing.trial), "{days} дней бесплатно");
  assert.equal(pluralize("ru", 1, ru.billing.trial), "{days} день бесплатно");
  assert.equal(pluralize("ru", 15, ru.billing.includes.team), "Команда из {count} человек");
});

const FEATURE_KEYS = [
  "advanced_calculation", "advanced_explanation", "ai_check", "case_save",
  "client_management", "declarant_chat", "declarant_team", "export",
  "manual_rate_verification", "manual_tnved_verification", "multi_line_cases",
  "personal_manager", "priority_processing", "scenario_compare",
  "standard_calculation", "version_history",
];
const LIMIT_KEYS = [
  "active_cases", "ai_checks_per_month", "calculations_per_month",
  "cases_per_month", "pdf_exports_per_month", "team_seats",
];
const PLAN_KEYS = ["basic", "start", "business", "pro", "team", "corporate", "vip"];

test("подписи на сайте есть для каждого ключа каталога на всех языках", () => {
  for (const locale of ["ru", "uz", "en", "zh"] as const) {
    for (const key of FEATURE_KEYS) {
      assert.ok(FEATURE_LABELS[locale][key], `${locale}: возможность ${key}`);
    }
    for (const key of LIMIT_KEYS) {
      assert.ok(LIMIT_LABELS[locale][key], `${locale}: лимит ${key}`);
    }
    for (const key of PLAN_KEYS) {
      assert.ok(PLAN_DESCRIPTIONS[locale][key], `${locale}: описание ${key}`);
    }
  }
});
