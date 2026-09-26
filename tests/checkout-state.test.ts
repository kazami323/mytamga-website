import { test } from "node:test";
import assert from "node:assert/strict";

import { checkoutActions } from "../lib/billing/checkout-state.ts";
import type { SubscriptionView } from "../lib/billing/subscription.ts";

const owner: SubscriptionView = {
  planKey: "basic",
  planLabel: "Basic",
  status: "active",
  source: "other",
  isStoreManaged: false,
  nextBillingAt: null,
  canManageSubscription: true,
  canRequestUpgrade: false,
  organizationName: "998901234567",
  seatsPurchased: 1,
  seatsUsed: 1,
};

const admin: SubscriptionView = {
  ...owner,
  canManageSubscription: false,
  canRequestUpgrade: true,
};

test("владельцу при необъявленных ценах не предлагают ничего, кроме объяснения", () => {
  // Кнопки «Запросить» у него быть не должно: права на заявку нет, и нажатие
  // вернуло бы 403 — тот самый тупик, который панель обходит.
  const state = checkoutActions({ pricesPublished: false, subscription: owner, onlineProviders: 1 });
  assert.equal(state.block, "pricesPending");
  assert.equal(state.canPay, false);
  assert.equal(state.canRequest, false);
});

test("владелец платит, когда цены объявлены и провайдер подключён", () => {
  const state = checkoutActions({ pricesPublished: true, subscription: owner, onlineProviders: 1 });
  assert.equal(state.block, null);
  assert.equal(state.canPay, true);
  assert.equal(state.canRequest, false);
});

test("админ платить не может, но может попросить", () => {
  const state = checkoutActions({ pricesPublished: true, subscription: admin, onlineProviders: 1 });
  assert.equal(state.block, "ownerOnly");
  assert.equal(state.canPay, false);
  assert.equal(state.canRequest, true);
});

test("подписка из магазина перевешивает всё остальное", () => {
  const state = checkoutActions({
    pricesPublished: true,
    subscription: { ...owner, isStoreManaged: true },
    onlineProviders: 1,
  });
  assert.equal(state.block, "storeManaged");
  assert.equal(state.canPay, false);
});

test("без подключённого провайдера оплату не предлагают", () => {
  const state = checkoutActions({ pricesPublished: true, subscription: owner, onlineProviders: 0 });
  assert.equal(state.block, "noProvider");
  assert.equal(state.canPay, false);
});

test("до входа кнопок нет вовсе", () => {
  const state = checkoutActions({ pricesPublished: true, subscription: null, onlineProviders: 1 });
  assert.equal(state.canPay, false);
  assert.equal(state.canRequest, false);
});

test("цены объявлены, но провайдера нет — про цены не врём", () => {
  // Порядок причин: сначала то, что относится лично к человеку, потом общее.
  const state = checkoutActions({ pricesPublished: false, subscription: admin, onlineProviders: 0 });
  assert.equal(state.block, "ownerOnly");
  assert.equal(state.canRequest, true);
});
