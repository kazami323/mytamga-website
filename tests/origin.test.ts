import { test } from "node:test";
import assert from "node:assert/strict";

import { isSameOrigin } from "../lib/api/origin.ts";

test("свой источник принимается", () => {
  assert.equal(isSameOrigin("https://mytamga.uz", "mytamga.uz"), true);
  assert.equal(isSameOrigin("http://localhost:3000", "localhost:3000"), true);
});

test("чужой источник отвергается", () => {
  assert.equal(isSameOrigin("https://evil.example", "mytamga.uz"), false);
  assert.equal(isSameOrigin("https://mytamga.uz.evil.example", "mytamga.uz"), false);
});

test("отсутствующий Origin или Host отвергается", () => {
  // Браузер присылает Origin на всех POST. Нет его — запрос не из браузера.
  assert.equal(isSameOrigin(null, "mytamga.uz"), false);
  assert.equal(isSameOrigin("https://mytamga.uz", null), false);
  assert.equal(isSameOrigin("null", "mytamga.uz"), false);
});
