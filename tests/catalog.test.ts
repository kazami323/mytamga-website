import { test } from "node:test";
import assert from "node:assert/strict";

import { parsePlans, parseProviders } from "../lib/billing/catalog.ts";

const plan = {
  key: "pro",
  label: "Pro",
  description: "Для постоянного импорта",
  priceMonthly: 39000,
  priceYearly: 390000,
  priceMonthlyFrom: null,
  currency: "UZS",
  trialDays: 0,
  seatsIncluded: 1,
  extraSeatPriceMonthly: null,
  isRequestOnly: false,
  features: [{ key: "ai_check", label: "AI-проверка" }],
  limits: [
    { key: "team_seats", label: "Мест в команде", value: 1, unlimited: false },
  ],
};

test("разбирает ответ каталога", () => {
  const parsed = parsePlans({ plans: [plan] });
  assert.equal(parsed?.length, 1);
  assert.equal(parsed?.[0].key, "pro");
  assert.equal(parsed?.[0].priceMonthly, 39000);
  assert.equal(parsed?.[0].features[0].key, "ai_check");
  assert.equal(parsed?.[0].limits[0].unlimited, false);
});

test("незнакомые поля не мешают", () => {
  const parsed = parsePlans({ plans: [{ ...plan, somethingNew: 42 }] });
  assert.equal(parsed?.length, 1);
});

test("структурно чужой ответ даёт null, а не пустой список", () => {
  assert.equal(parsePlans(null), null);
  assert.equal(parsePlans({}), null);
  assert.equal(parsePlans({ plans: "pro" }), null);
  assert.equal(parsePlans("<html>502 Bad Gateway</html>"), null);
});

test("тариф без ключа или цены отбрасывается, остальные остаются", () => {
  const parsed = parsePlans({
    plans: [plan, { label: "Сломанный" }, { ...plan, key: "vip", priceMonthly: "дорого" }],
  });
  assert.equal(parsed?.length, 1);
  assert.equal(parsed?.[0].key, "pro");
});

test("пустой каталог — это пустой список, а не отказ", () => {
  assert.deepEqual(parsePlans({ plans: [] }), []);
});

test("разбирает провайдеров и их доступность", () => {
  const parsed = parseProviders({
    providers: [
      { key: "click", label: "Click", status: "active", online: true },
      { key: "payme", label: "Payme", status: "not_connected", online: false },
      { key: "broken" },
    ],
  });
  assert.equal(parsed?.length, 2);
  assert.equal(parsed?.[0].online, true);
  assert.equal(parsed?.[1].online, false);
});

test("чужой ответ провайдеров даёт null", () => {
  assert.equal(parseProviders({ providers: {} }), null);
});
