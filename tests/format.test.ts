import { test } from "node:test";
import assert from "node:assert/strict";

import { groupDigits, yearlyMonths } from "../lib/billing/format.ts";

// U+202F, узкий неразрывный пробел — тот же разделитель, что в приложении.
const NNBSP = " ";

test("группирует разряды узким неразрывным пробелом", () => {
  assert.equal(groupDigits(39000), `39${NNBSP}000`);
  assert.equal(groupDigits(2490000), `2${NNBSP}490${NNBSP}000`);
});

test("короткие числа остаются как есть", () => {
  assert.equal(groupDigits(0), "0");
  assert.equal(groupDigits(999), "999");
});

test("дробное и отрицательное не ломают разделитель", () => {
  assert.equal(groupDigits(1234.56), `1${NNBSP}235`);
  assert.equal(groupDigits(-39000), `-39${NNBSP}000`);
});

test("число платежей в году считается из каталога", () => {
  assert.equal(yearlyMonths(39000, 390000), 10);
  assert.equal(yearlyMonths(249000, 2490000), 10);
});

test("бесплатный или отсутствующий год не даёт числа платежей", () => {
  assert.equal(yearlyMonths(0, 0), null);
  assert.equal(yearlyMonths(39000, 0), null);
});
