import { test } from "node:test";
import assert from "node:assert/strict";

import {
  normalizePeriod,
  parseCheckout,
  effectNeedsConfirmation,
  effectEndsAt,
} from "../lib/billing/checkout-effect.ts";

test("ответ нового сервера разбирается целиком", () => {
  const offer = parseCheckout({
    url: "https://my.click.uz/services/pay?x=1",
    transactionId: "t-1",
    billingPeriod: "yearly",
    amount: 1490000,
    effect: "upgrade",
  });
  assert.deepEqual(offer, {
    url: "https://my.click.uz/services/pay?x=1",
    transactionId: "t-1",
    billingPeriod: "yearly",
    amount: 1490000,
    effect: "upgrade",
  });
});

test("старый сервер без effect и amount не ломает разбор", () => {
  const offer = parseCheckout({ url: "https://my.click.uz/pay", transactionId: "t-2" });
  assert.equal(offer?.effect, null);
  assert.equal(offer?.amount, null);
  assert.equal(offer?.billingPeriod, null);
  assert.equal(effectNeedsConfirmation(offer!), false);
});

test("без адреса оплаты предложения нет", () => {
  assert.equal(parseCheckout({ transactionId: "t" }), null);
  assert.equal(parseCheckout(null), null);
  assert.equal(parseCheckout("x"), null);
});

test("неизвестный effect и мусорные поля отбрасываются", () => {
  const offer = parseCheckout({ url: "u", effect: "refund", amount: "много", billingPeriod: "weekly" });
  assert.equal(offer?.effect, null);
  assert.equal(offer?.amount, null);
  assert.equal(offer?.billingPeriod, null);
});

test("известный effect требует подтверждения до перехода в Click", () => {
  for (const effect of ["new", "extend", "upgrade", "defer"] as const) {
    assert.equal(effectNeedsConfirmation(parseCheckout({ url: "u", effect })!), true);
  }
});

test("период по умолчанию — месяц", () => {
  assert.equal(normalizePeriod("yearly"), "yearly");
  assert.equal(normalizePeriod("monthly"), "monthly");
  assert.equal(normalizePeriod(undefined), "monthly");
  assert.equal(normalizePeriod("year"), "monthly");
});

test("дата окончания называется только для нового тарифа и продления", () => {
  const now = Date.UTC(2026, 9, 15);
  const day = 24 * 60 * 60 * 1000;
  assert.equal(effectEndsAt({ effect: "new", period: "monthly", currentEnd: null, now })?.getTime(), now + 30 * day);
  assert.equal(effectEndsAt({ effect: "new", period: "yearly", currentEnd: null, now })?.getTime(), now + 365 * day);
  const end = "2026-11-01T00:00:00.000Z";
  assert.equal(
    effectEndsAt({ effect: "extend", period: "monthly", currentEnd: end, now })?.getTime(),
    Date.parse(end) + 30 * day,
  );
  assert.equal(effectEndsAt({ effect: "extend", period: "monthly", currentEnd: null, now }), null);
  assert.equal(effectEndsAt({ effect: "upgrade", period: "monthly", currentEnd: end, now }), null);
  assert.equal(effectEndsAt({ effect: "defer", period: "monthly", currentEnd: end, now }), null);
  assert.equal(effectEndsAt({ effect: null, period: "monthly", currentEnd: end, now }), null);
});
