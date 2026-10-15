import { test } from "node:test";
import assert from "node:assert/strict";

import { POLL_DEADLINE_MS, POLL_INTERVAL_MS, pollOutcome } from "../lib/billing/poll.ts";

const active = {
  planKey: "pro",
  planLabel: "Pro",
  status: "active" as const,
  source: "site" as const,
  isStoreManaged: false,
  nextBillingAt: "2026-10-26T00:00:00.000Z",
  canManageSubscription: true,
  canRequestUpgrade: false,
  organizationName: null,
  seatsPurchased: 1,
  seatsUsed: 1,
  scheduledPlan: null,
};

test("опрос идёт каждые три секунды, не дольше минуты", () => {
  assert.equal(POLL_INTERVAL_MS, 3000);
  assert.equal(POLL_DEADLINE_MS, 60_000);
});

test("оплаченный тариф — успех", () => {
  assert.equal(
    pollOutcome({ subscription: active, elapsedMs: 3000, expectedPlanKey: "pro" }),
    "success",
  );
});

test("тариф ещё не включился — продолжаем ждать", () => {
  assert.equal(
    pollOutcome({ subscription: { ...active, planKey: "basic" }, elapsedMs: 3000, expectedPlanKey: "pro" }),
    "pending",
  );
  assert.equal(
    pollOutcome({ subscription: { ...active, status: "expired" }, elapsedMs: 3000, expectedPlanKey: "pro" }),
    "pending",
  );
});

test("без номера платежа успехом считается любой платный активный тариф", () => {
  // Куки платежа могло не остаться: человек вернулся через час или с другого
  // устройства. Ждать «именно pro» тогда неоткуда.
  assert.equal(pollOutcome({ subscription: active, elapsedMs: 3000, expectedPlanKey: null }), "success");
  assert.equal(
    pollOutcome({ subscription: { ...active, planKey: "basic" }, elapsedMs: 3000, expectedPlanKey: null }),
    "pending",
  );
});

test("истёкшая сессия прекращает опрос сразу, а не через минуту", () => {
  assert.equal(pollOutcome({ code: "signedOut", elapsedMs: 3000 }), "signedOut");
  assert.equal(pollOutcome({ code: "noOrganization", elapsedMs: 3000 }), "signedOut");
});

test("сетевая ошибка не прекращает опрос: сервер мог просто не ответить", () => {
  assert.equal(pollOutcome({ code: "network", elapsedMs: 3000 }), "pending");
});

test("по истечении минуты опрос останавливается", () => {
  assert.equal(pollOutcome({ subscription: { ...active, planKey: "basic" }, elapsedMs: 60_000, expectedPlanKey: "pro" }), "timeout");
  assert.equal(pollOutcome({ code: "network", elapsedMs: 61_000 }), "timeout");
});

test("успех перевешивает истечение времени", () => {
  // Последний ответ пришёл на шестидесятой секунде — это оплата, не таймаут.
  assert.equal(
    pollOutcome({ subscription: active, elapsedMs: 60_000, expectedPlanKey: "pro" }),
    "success",
  );
});

test("отложенный тариф: оплата видна по scheduledPlan, текущий тариф не меняется", () => {
  const scheduled = { key: "business", label: "Business", startsAt: "2026-11-01T00:00:00.000Z", until: null };
  assert.equal(
    pollOutcome({ subscription: { ...active, scheduledPlan: scheduled }, elapsedMs: 3000, expectedPlanKey: "business" }),
    "success",
  );
  assert.equal(
    pollOutcome({ subscription: active, elapsedMs: 3000, expectedPlanKey: "business" }),
    "pending",
  );
});
