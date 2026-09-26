import { test } from "node:test";
import assert from "node:assert/strict";

import { toUzPhone } from "../lib/api/phone.ts";

test("принимает номер, как его пишут люди", () => {
  assert.equal(toUzPhone("+998 90 123-45-67"), "998901234567");
  assert.equal(toUzPhone("998901234567"), "998901234567");
  assert.equal(toUzPhone("(998) 90 1234567"), "998901234567");
});

test("девять цифр дополняются кодом страны", () => {
  assert.equal(toUzPhone("901234567"), "998901234567");
  assert.equal(toUzPhone("90 123 45 67"), "998901234567");
});

test("международная запись через 00 понимается", () => {
  assert.equal(toUzPhone("00998901234567"), "998901234567");
});

test("чужие и неполные номера отвергаются", () => {
  assert.equal(toUzPhone(""), null);
  assert.equal(toUzPhone("90123456"), null);
  assert.equal(toUzPhone("79161234567"), null);
  assert.equal(toUzPhone("8 901 234 56 78"), null);
  assert.equal(toUzPhone("9981234567890"), null);
  assert.equal(toUzPhone("не помню"), null);
});
