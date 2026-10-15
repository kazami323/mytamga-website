import { test } from "node:test";
import assert from "node:assert/strict";

import { AUTORENEW_AVAILABLE, PRICES_PUBLISHED } from "../lib/billing/flags.ts";

// Растяжка, а не проверка логики. Включение кассы обязано быть осознанной
// правкой: она ломает этот тест, и в том же диффе видно, что сверили сумму у
// провайдера (см. «Зависимости», пункт 1 спеки).
test("цены объявлены: сетка 15.10.2026, суммы берутся из каталога API", () => {
  assert.equal(PRICES_PUBLISHED, true);
});

test("автопродления на сервере ещё нет", () => {
  assert.equal(AUTORENEW_AVAILABLE, false);
});
