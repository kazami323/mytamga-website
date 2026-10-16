import { test } from "node:test";
import assert from "node:assert/strict";

import { FEATURE_LABELS, LIMIT_LABELS } from "../lib/billing/label-maps.ts";

// Ключи каталога на 26.09.2026, снятые с BILLING_FEATURE_REGISTRY и
// BILLING_LIMIT_REGISTRY. Каталог может пополниться — тогда браузерная
// проверка labels.mjs скажет об этом, а страница покажет русскую подпись.
const FEATURES = [
  "standard_calculation", "case_save", "export", "ai_check",
  "advanced_calculation", "advanced_explanation", "version_history",
  "scenario_compare", "multi_line_cases", "declarant_chat",
  "client_management", "declarant_team", "priority_processing",
  "personal_manager", "manual_rate_verification", "manual_tnved_verification",
];

const LIMITS = [
  "calculations_per_month", "active_cases", "cases_per_month",
  "ai_checks_per_month", "pdf_exports_per_month", "team_seats",
];

test("четыре языка переводят все известные возможности", () => {
  for (const locale of ["ru", "uz", "en", "zh"] as const) {
    for (const key of FEATURES) {
      assert.ok(FEATURE_LABELS[locale]?.[key], `${locale}: нет подписи для ${key}`);
    }
  }
});

test("четыре языка переводят все известные лимиты", () => {
  for (const locale of ["ru", "uz", "en", "zh"] as const) {
    for (const key of LIMITS) {
      assert.ok(LIMIT_LABELS[locale]?.[key], `${locale}: нет подписи для ${key}`);
    }
  }
});

test("лишних ключей в картах нет — иначе они переживут удаление из каталога", () => {
  for (const locale of ["ru", "uz", "en", "zh"] as const) {
    assert.deepEqual(Object.keys(FEATURE_LABELS[locale] ?? {}).sort(), [...FEATURES].sort());
    assert.deepEqual(Object.keys(LIMIT_LABELS[locale] ?? {}).sort(), [...LIMITS].sort());
  }
});
