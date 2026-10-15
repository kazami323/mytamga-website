import { test } from "node:test";
import assert from "node:assert/strict";

import {
  POLL_DEADLINE_MS,
  POLL_INTERVAL_MS,
  baselineFor,
  parseBaseline,
  pollOutcome,
  serializeBaseline,
} from "../lib/billing/poll.ts";

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

test("продление того же тарифа: пока срок не сдвинулся, оплаты нет", () => {
  const baseline = { effect: "extend" as const, planKey: "pro", endsAt: active.nextBillingAt, scheduledKey: null, scheduledUntil: null };
  assert.equal(pollOutcome({ subscription: active, elapsedMs: 3000, expectedPlanKey: "pro", baseline }), "pending");
  assert.equal(pollOutcome({ subscription: active, elapsedMs: 60_000, expectedPlanKey: "pro", baseline }), "timeout");
  const extended = { ...active, nextBillingAt: "2026-11-25T00:00:00.000Z" };
  assert.equal(pollOutcome({ subscription: extended, elapsedMs: 3000, expectedPlanKey: "pro", baseline }), "success");
});

test("продление без исходного срока ждёт подтверждения, а не угадывает", () => {
  const baseline = { effect: "extend" as const, planKey: "pro", endsAt: null, scheduledKey: null, scheduledUntil: null };
  assert.equal(pollOutcome({ subscription: active, elapsedMs: 3000, expectedPlanKey: "pro", baseline }), "pending");
});

test("отложенный тариф: повтор ждёт, пока сдвинется срок очереди", () => {
  const queued = { key: "business", label: "Business", startsAt: "2026-10-26T00:00:00.000Z", until: "2026-11-25T00:00:00.000Z" };
  const baseline = { effect: "defer" as const, planKey: "business", endsAt: active.nextBillingAt, scheduledKey: "business", scheduledUntil: queued.until };
  const same = { ...active, scheduledPlan: queued };
  assert.equal(pollOutcome({ subscription: same, elapsedMs: 3000, expectedPlanKey: "business", baseline }), "pending");
  const moved = { ...active, scheduledPlan: { ...queued, until: "2026-12-25T00:00:00.000Z" } };
  assert.equal(pollOutcome({ subscription: moved, elapsedMs: 3000, expectedPlanKey: "business", baseline }), "success");
});

test("отложенный тариф впервые: успех, когда он появился в очереди", () => {
  const baseline = { effect: "defer" as const, planKey: "business", endsAt: active.nextBillingAt, scheduledKey: null, scheduledUntil: null };
  const queued = { key: "business", label: "Business", startsAt: null, until: null };
  assert.equal(pollOutcome({ subscription: active, elapsedMs: 3000, expectedPlanKey: "business", baseline }), "pending");
  assert.equal(pollOutcome({ subscription: { ...active, scheduledPlan: queued }, elapsedMs: 3000, expectedPlanKey: "business", baseline }), "success");
});

test("исходное состояние чужого тарифа правило не меняет", () => {
  const baseline = { effect: "extend" as const, planKey: "start", endsAt: active.nextBillingAt, scheduledKey: null, scheduledUntil: null };
  assert.equal(pollOutcome({ subscription: active, elapsedMs: 3000, expectedPlanKey: "pro", baseline }), "success");
});

test("исходное состояние переживает куку и отбрасывает мусор", () => {
  const baseline = baselineFor("extend", "pro", active);
  assert.ok(baseline);
  assert.deepEqual(parseBaseline(serializeBaseline(baseline)), baseline);
  assert.equal(baselineFor("new", "pro", active), null);
  assert.equal(baselineFor("extend", "pro", null), null);
  assert.equal(parseBaseline("%7Bbroken"), null);
  assert.equal(parseBaseline(encodeURIComponent('{"effect":"upgrade","planKey":"pro"}')), null);
  assert.equal(parseBaseline(undefined), null);
});
