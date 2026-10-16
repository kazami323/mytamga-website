import assert from "node:assert/strict";
import { test } from "node:test";

import { httpsRedirectTarget, requestOrigin, shouldSendHsts } from "../lib/https.ts";

const SITE = "https://mytamga.uz";
const h = (o: Record<string, string>) => ({ get: (n: string) => o[n.toLowerCase()] ?? null });
// Next за прокси видит внутренний адрес сервера — путь берём из него, хост из заголовков.
const internal = new URL("http://127.0.0.1:3000/ru/pricing?period=year");

test("хост и схема — из заголовков, порт отрезается, берётся первое значение", () => {
  assert.deepEqual(requestOrigin(h({ host: "MyTamga.uz:80", "x-forwarded-proto": "http" })), { host: "mytamga.uz", proto: "http" });
  assert.deepEqual(requestOrigin(h({ host: "x", "x-forwarded-host": "mytamga.uz", "x-forwarded-proto": "https, http" })), { host: "mytamga.uz", proto: "https" });
  assert.deepEqual(requestOrigin(h({ host: "mytamga.uz" })), { host: "mytamga.uz", proto: null });
  assert.deepEqual(requestOrigin(h({ host: "mytamga.uz", "x-forwarded-proto": "wss" })).proto, null);
});

test("http на боевом хосте → https с тем же путём и запросом, не на внутренний адрес", () => {
  const target = httpsRedirectTarget(internal, { host: "mytamga.uz", proto: "http" }, SITE, true);
  assert.equal(target?.toString(), "https://mytamga.uz/ru/pricing?period=year");
});

test("https и неизвестная схема не перенаправляются", () => {
  assert.equal(httpsRedirectTarget(internal, { host: "mytamga.uz", proto: "https" }, SITE, true), null);
  assert.equal(httpsRedirectTarget(internal, { host: "mytamga.uz", proto: null }, SITE, true), null);
});

test("чужой хост, не production, нет адреса сайта — ничего", () => {
  assert.equal(httpsRedirectTarget(internal, { host: "localhost", proto: "http" }, SITE, true), null);
  assert.equal(httpsRedirectTarget(internal, { host: "mytamga.uz", proto: "http" }, SITE, false), null);
  assert.equal(httpsRedirectTarget(internal, { host: "mytamga.uz", proto: "http" }, undefined, true), null);
  assert.equal(httpsRedirectTarget(internal, { host: "mytamga.uz", proto: "http" }, "не адрес", true), null);
});

test("HSTS только на защищённый запрос к боевому хосту в production", () => {
  assert.equal(shouldSendHsts({ host: "mytamga.uz", proto: "https" }, SITE, true), true);
  assert.equal(shouldSendHsts({ host: "mytamga.uz", proto: "http" }, SITE, true), false);
  assert.equal(shouldSendHsts({ host: "mytamga.uz", proto: null }, SITE, true), false);
  assert.equal(shouldSendHsts({ host: "localhost", proto: "https" }, SITE, true), false);
  assert.equal(shouldSendHsts({ host: "mytamga.uz", proto: "https" }, SITE, false), false);
});

test("путь вида //чужой.хост не уводит на чужой сайт", () => {
  for (const path of ["//evil.com/x", "///evil.com", "/\\evil.com"]) {
    const target = httpsRedirectTarget(new URL("http://127.0.0.1:3000" + path), { host: "mytamga.uz", proto: "http" }, SITE, true);
    assert.equal(target?.host, "mytamga.uz", path);
  }
});
