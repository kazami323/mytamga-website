import { test } from "node:test";
import assert from "node:assert/strict";

import { checkoutActions, type SelectedPlan } from "../lib/billing/checkout-state.ts";
import { CHECKOUT_SELLABLE_PLAN_KEYS } from "../lib/billing/flags.ts";
import type { SubscriptionView } from "../lib/billing/subscription.ts";

const pro: SelectedPlan = { key: "pro", isRequestOnly: false, priceMonthly: 39000 };
const business: SelectedPlan = { key: "business", isRequestOnly: false, priceMonthly: 249000 };
const vip: SelectedPlan = { key: "vip", isRequestOnly: true, priceMonthly: 0 };
const basic: SelectedPlan = { key: "basic", isRequestOnly: false, priceMonthly: 0 };

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
  const state = checkoutActions({ pricesPublished: false, subscription: owner, onlineProviders: 1, plan: pro, sellablePlanKeys: CHECKOUT_SELLABLE_PLAN_KEYS });
  assert.equal(state.block, "pricesPending");
  assert.equal(state.canPay, false);
  assert.equal(state.canRequest, false);
});

test("владелец платит, когда цены объявлены и провайдер подключён", () => {
  const state = checkoutActions({ pricesPublished: true, subscription: owner, onlineProviders: 1, plan: pro, sellablePlanKeys: CHECKOUT_SELLABLE_PLAN_KEYS });
  assert.equal(state.block, null);
  assert.equal(state.canPay, true);
  assert.equal(state.canRequest, false);
});

test("админ платить не может, но может попросить", () => {
  const state = checkoutActions({ pricesPublished: true, subscription: admin, onlineProviders: 1, plan: pro, sellablePlanKeys: CHECKOUT_SELLABLE_PLAN_KEYS });
  assert.equal(state.block, "ownerOnly");
  assert.equal(state.canPay, false);
  assert.equal(state.canRequest, true);
});

test("подписка из магазина перевешивает всё остальное", () => {
  const state = checkoutActions({
    pricesPublished: true,
    subscription: { ...owner, isStoreManaged: true },
    onlineProviders: 1,
    plan: pro,
    sellablePlanKeys: CHECKOUT_SELLABLE_PLAN_KEYS,
  });
  assert.equal(state.block, "storeManaged");
  assert.equal(state.canPay, false);
});

test("без подключённого провайдера оплату не предлагают", () => {
  const state = checkoutActions({ pricesPublished: true, subscription: owner, onlineProviders: 0, plan: pro, sellablePlanKeys: CHECKOUT_SELLABLE_PLAN_KEYS });
  assert.equal(state.block, "noProvider");
  assert.equal(state.canPay, false);
});

test("до входа кнопок нет вовсе", () => {
  const state = checkoutActions({ pricesPublished: true, subscription: null, onlineProviders: 1, plan: pro, sellablePlanKeys: CHECKOUT_SELLABLE_PLAN_KEYS });
  assert.equal(state.canPay, false);
  assert.equal(state.canRequest, false);
});

test("цены объявлены, но провайдера нет — про цены не врём", () => {
  // Порядок причин: сначала то, что относится лично к человеку, потом общее.
  const state = checkoutActions({ pricesPublished: false, subscription: admin, onlineProviders: 0, plan: pro, sellablePlanKeys: CHECKOUT_SELLABLE_PLAN_KEYS });
  assert.equal(state.block, "ownerOnly");
  assert.equal(state.canRequest, true);
});

test("тариф по заявке не продаётся кассой, даже когда цены объявлены", () => {
  // Click отвергает всё, кроме Pro. Показать владельцу кнопку оплаты на VIP
  // значит привести его к 400 уже после нажатия.
  const state = checkoutActions({ pricesPublished: true, subscription: owner, onlineProviders: 1, plan: vip, sellablePlanKeys: CHECKOUT_SELLABLE_PLAN_KEYS });
  assert.equal(state.block, "requestOnly");
  assert.equal(state.canPay, false);
});

test("Business через кассу тоже не оформляется", () => {
  const state = checkoutActions({ pricesPublished: true, subscription: owner, onlineProviders: 1, plan: business, sellablePlanKeys: CHECKOUT_SELLABLE_PLAN_KEYS });
  assert.equal(state.block, "requestOnly");
  assert.equal(state.canPay, false);
});

test("бесплатный тариф не продают: он уже включён", () => {
  const state = checkoutActions({ pricesPublished: true, subscription: owner, onlineProviders: 1, plan: basic, sellablePlanKeys: CHECKOUT_SELLABLE_PLAN_KEYS });
  assert.equal(state.block, "freePlan");
  assert.equal(state.canPay, false);
});

test("тариф ещё не выбран — кнопки оплаты нет", () => {
  const state = checkoutActions({ pricesPublished: true, subscription: owner, onlineProviders: 1, plan: null, sellablePlanKeys: CHECKOUT_SELLABLE_PLAN_KEYS });
  assert.equal(state.canPay, false);
});

test("истёкшая подписка из магазина не запирает кассу", () => {
  // Сервер отказывает 409 только по активной подписке магазина. Если она
  // истекла, он продал бы — а мы говорили «управляйте в магазине» и не давали
  // купить вовсе.
  const expired = { ...owner, isStoreManaged: true, status: "expired" as const };
  const state = checkoutActions({ pricesPublished: true, subscription: expired, onlineProviders: 1, plan: pro, sellablePlanKeys: CHECKOUT_SELLABLE_PLAN_KEYS });
  assert.equal(state.block, null);
  assert.equal(state.canPay, true);
});

test("активная подписка из магазина по-прежнему перевешивает", () => {
  const active = { ...owner, isStoreManaged: true, status: "active" as const };
  const state = checkoutActions({ pricesPublished: true, subscription: active, onlineProviders: 1, plan: pro, sellablePlanKeys: CHECKOUT_SELLABLE_PLAN_KEYS });
  assert.equal(state.block, "storeManaged");
});

test("порядок причин: своё право важнее общего состояния сервиса", () => {
  const state = checkoutActions({ pricesPublished: false, subscription: admin, onlineProviders: 0, plan: vip, sellablePlanKeys: CHECKOUT_SELLABLE_PLAN_KEYS });
  assert.equal(state.block, "ownerOnly");
  assert.equal(state.canRequest, true);
});

test("список продаваемых тарифов — состояние сервера, а не догадка", () => {
  // Сегодня Click оформляет только Pro. Когда сервер научится Business, здесь
  // изменится один ключ, и касса откроется сама.
  assert.deepEqual([...CHECKOUT_SELLABLE_PLAN_KEYS], ["pro"]);

  const state = checkoutActions({
    pricesPublished: true,
    subscription: owner,
    onlineProviders: 1,
    plan: business,
    sellablePlanKeys: ["pro", "business"],
  });
  assert.equal(state.block, null);
  assert.equal(state.canPay, true);
});
