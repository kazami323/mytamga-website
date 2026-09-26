import { test } from "node:test";
import assert from "node:assert/strict";

import { labelFor } from "../lib/billing/labels.ts";

const uz: Record<string, string> = { ai_check: "AI tekshiruvi" };

test("известный ключ берётся из карты языка", () => {
  assert.equal(labelFor(uz, "ai_check", "AI-проверка"), "AI tekshiruvi");
});

test("незнакомый ключ показывается русской подписью из API", () => {
  assert.equal(labelFor(uz, "brand_new_feature", "Совсем новое"), "Совсем новое");
});

test("русская страница карты не имеет и всегда берёт API", () => {
  assert.equal(labelFor(undefined, "ai_check", "AI-проверка"), "AI-проверка");
});

test("пустая подпись в карте не прячет содержимое", () => {
  assert.equal(labelFor({ ai_check: "  " }, "ai_check", "AI-проверка"), "AI-проверка");
});

test("если и API молчит, показывается ключ, а не пустота", () => {
  // Пустая строчка в списке возможностей читается как сбой вёрстки.
  assert.equal(labelFor(undefined, "ai_check", ""), "ai_check");
});
