import { test } from "node:test";
import assert from "node:assert/strict";

import { parseSubscription } from "../lib/billing/subscription.ts";

const summary = {
  ok: true,
  plan: { key: "pro", label: "Pro", description: "…" },
  status: "active",
  stripeStatus: "click_paid",
  nextBillingAt: "2026-10-26T00:00:00.000Z",
  billingPermissions: { canManageSubscription: true },
  seatsPurchased: 1,
  seatsUsed: 1,
  organization: { id: "org-1", name: "ООО Ромашка", secret: "не наше дело" },
};

test("сводит ответ API к узкому виду", () => {
  const view = parseSubscription(summary);
  assert.equal(view?.planKey, "pro");
  assert.equal(view?.status, "active");
  assert.equal(view?.canManageSubscription, true);
  assert.equal(view?.nextBillingAt, "2026-10-26T00:00:00.000Z");
  assert.equal(view?.organizationName, "ООО Ромашка");
});

test("внутренности организации наружу не уходят", () => {
  const view = parseSubscription(summary);
  assert.equal("organization" in (view as object), false);
  assert.equal(JSON.stringify(view).includes("не наше дело"), false);
});

test("источник оплаты называется понятным словом", () => {
  assert.equal(parseSubscription(summary)?.source, "site");
  assert.equal(parseSubscription({ ...summary, stripeStatus: "app_store" })?.source, "appStore");
  assert.equal(parseSubscription({ ...summary, stripeStatus: "play_store" })?.source, "playStore");
  assert.equal(parseSubscription({ ...summary, stripeStatus: "trialing" })?.source, "other");
  assert.equal(parseSubscription({ ...summary, stripeStatus: null })?.source, "other");
});

test("подписка из магазина видна отдельным признаком", () => {
  assert.equal(parseSubscription(summary)?.isStoreManaged, false);
  assert.equal(
    parseSubscription({ ...summary, stripeStatus: "app_store" })?.isStoreManaged,
    true,
  );
});

test("отсутствие прав на оплату — не то же, что их наличие", () => {
  const view = parseSubscription({ ...summary, billingPermissions: {} });
  assert.equal(view?.canManageSubscription, false);
});

test("чужой ответ даёт null", () => {
  assert.equal(parseSubscription(null), null);
  assert.equal(parseSubscription({ plan: "pro" }), null);
  assert.equal(parseSubscription({ status: "active" }), null);
});

test("неизвестный статус сводится к истёкшему, а не к активному", () => {
  // Ошибаться надо в сторону «доступа нет»: обратное открывает платное даром.
  assert.equal(parseSubscription({ ...summary, status: "что-то новое" })?.status, "expired");
});
