import { test } from "node:test";
import assert from "node:assert/strict";

import { fill } from "../lib/i18n/interpolate.ts";

test("подставляет значения по имени", () => {
  assert.equal(fill("{amount} сум/мес", { amount: "39 000" }), "39 000 сум/мес");
  assert.equal(fill("Год стоит как {months} месяцев", { months: 10 }), "Год стоит как 10 месяцев");
});

test("подставляет одно имя несколько раз", () => {
  assert.equal(fill("{a} и ещё {a}", { a: "раз" }), "раз и ещё раз");
});

test("неизвестное место остаётся как есть, а не становится undefined", () => {
  // Слово "undefined" на странице тарифов выглядит как сломанный сайт.
  assert.equal(fill("{amount} сум", {}), "{amount} сум");
});

test("текст без подстановок не меняется", () => {
  assert.equal(fill("Бесплатно", { amount: "39 000" }), "Бесплатно");
});
