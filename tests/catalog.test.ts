import { test } from "node:test";
import assert from "node:assert/strict";

import { isCatalogUsable, offerableProviders, parsePlans, parseProviders, planPrice, yearlySaving } from "../lib/billing/catalog.ts";
import { PROVIDERS_HIDDEN_FROM_UI } from "../lib/billing/flags.ts";

const plan = {
  key: "pro",
  label: "Pro",
  description: "Для постоянного импорта",
  priceMonthly: 349000,
  priceYearly: 3490000,
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
  assert.equal(parsed?.[0].priceMonthly, 349000);
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

test("каталог годен только когда в нём есть хотя бы один тариф", () => {
  // Пустая сетка без объяснения — ровно то, что запрещено: страница обязана
  // сказать, что цен нет, а не молча отрисовать пустой список.
  assert.equal(isCatalogUsable(null), false);
  assert.equal(isCatalogUsable([]), false);
  assert.equal(isCatalogUsable(parsePlans({ plans: [plan] })), true);
  assert.equal(isCatalogUsable(parsePlans({ plans: [{ foo: 1 }, "x", null] })), false);
});

test("Stripe до интерфейса не доходит, даже если реестр объявил его подключённым", () => {
  // Он списывает цену из своей настройки, которой в каталоге нет вовсе, и для
  // узбекского юрлица не работает. Реестр включает его от одних ключей в
  // окружении — этого достаточно, чтобы он всплыл на странице.
  const providers = parseProviders({
    providers: [
      { key: "click", label: "Click", status: "active", online: true },
      { key: "stripe", label: "Stripe", status: "active", online: true },
      { key: "payme", label: "Payme", status: "not_connected", online: false },
    ],
  });

  const offered = offerableProviders(providers ?? [], PROVIDERS_HIDDEN_FROM_UI);

  assert.deepEqual(offered.map((p) => p.key), ["click"]);
});

test("скрытый список — это именно Stripe и ничего больше", () => {
  assert.deepEqual([...PROVIDERS_HIDDEN_FROM_UI], ["stripe"]);
});

test("неподключённый провайдер не предлагается, но и не скрывается из списка", () => {
  const providers = parseProviders({
    providers: [{ key: "payme", label: "Payme", status: "not_connected", online: false }],
  });
  assert.deepEqual(offerableProviders(providers ?? [], PROVIDERS_HIDDEN_FROM_UI), []);
});

const grid = [
  { ...plan, key: "vip", label: "Enterprise", priceMonthly: 0, priceYearly: null, isRequestOnly: true },
  { ...plan, key: "team", priceMonthly: 790000, priceYearly: 7900000 },
  { ...plan, key: "pro" },
  { ...plan, key: "basic", priceMonthly: 0, priceYearly: 0 },
  { ...plan, key: "corporate", priceMonthly: 1490000, priceYearly: 14900000 },
  { ...plan, key: "start", priceMonthly: 49000, priceYearly: 490000 },
  { ...plan, key: "business", priceMonthly: 149000, priceYearly: 1490000 },
];

test("карточки идут по возрастанию цены: бесплатный первым, по заявке последним", () => {
  const keys = parsePlans({ plans: grid })?.map((p) => p.key);
  assert.deepEqual(keys, ["basic", "start", "business", "pro", "team", "corporate", "vip"]);
});

test("цена периода берётся из каталога, а не считается на сайте", () => {
  const pro = parsePlans({ plans: [plan] })![0];
  assert.equal(planPrice(pro, "monthly"), 349000);
  assert.equal(planPrice(pro, "yearly"), 3490000);
  const vip = parsePlans({ plans: grid })!.find((p) => p.key === "vip")!;
  assert.equal(planPrice(vip, "yearly"), null);
  assert.equal(planPrice(vip, "monthly"), null);
});

test("выгода года — разница с двенадцатью месяцами", () => {
  const start = parsePlans({ plans: grid })!.find((p) => p.key === "start")!;
  assert.equal(yearlySaving(start), 98000);
  const basic = parsePlans({ plans: grid })!.find((p) => p.key === "basic")!;
  assert.equal(yearlySaving(basic), null);
});
