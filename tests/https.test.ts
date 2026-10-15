import assert from "node:assert/strict";
import { test } from "node:test";

import { httpsRedirectTarget, shouldSendHsts } from "../lib/https.ts";

const SITE = "https://mytamga.uz";

test("http на боевом хосте → https с тем же путём и запросом", () => {
  const target = httpsRedirectTarget(new URL("http://mytamga.uz/ru/pricing?period=year"), SITE, true);
  assert.equal(target?.toString(), "https://mytamga.uz/ru/pricing?period=year");
});

test("https не перенаправляется", () => {
  assert.equal(httpsRedirectTarget(new URL("https://mytamga.uz/ru"), SITE, true), null);
});

test("localhost и чужие хосты не трогаются", () => {
  assert.equal(httpsRedirectTarget(new URL("http://localhost:3000/ru"), SITE, true), null);
  assert.equal(httpsRedirectTarget(new URL("http://preview.example.com/ru"), SITE, true), null);
});

test("вне production и без адреса сайта — ничего", () => {
  assert.equal(httpsRedirectTarget(new URL("http://mytamga.uz/ru"), SITE, false), null);
  assert.equal(httpsRedirectTarget(new URL("http://mytamga.uz/ru"), undefined, true), null);
  assert.equal(httpsRedirectTarget(new URL("http://mytamga.uz/ru"), "не адрес", true), null);
});

test("HSTS только на защищённый запрос к боевому хосту в production", () => {
  assert.equal(shouldSendHsts(new URL("https://mytamga.uz/ru"), SITE, true), true);
  assert.equal(shouldSendHsts(new URL("http://mytamga.uz/ru"), SITE, true), false);
  assert.equal(shouldSendHsts(new URL("https://localhost:3000/ru"), SITE, true), false);
  assert.equal(shouldSendHsts(new URL("https://mytamga.uz/ru"), SITE, false), false);
});
