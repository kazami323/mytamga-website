import { test } from "node:test";
import assert from "node:assert/strict";

import { ApiError } from "../lib/api/errors.ts";
import { buildHeaders, callApi } from "../lib/api/server.ts";

test("каждый запрос называет себя веб-клиентом", () => {
  const headers = buildHeaders({ path: "/api/auth/send-code" });
  assert.equal(headers["x-platform"], "web");
});

test("тело запроса объявляется только когда оно есть", () => {
  assert.equal(buildHeaders({ path: "/x" })["content-type"], undefined);
  assert.equal(
    buildHeaders({ path: "/x", method: "POST", body: {} })["content-type"],
    "application/json",
  );
});

test("токен, устройство и адрес клиента доезжают до API", () => {
  const headers = buildHeaders({
    path: "/x",
    accessToken: "token-value",
    deviceId: "device-value",
    clientIp: "203.0.113.7",
    userAgent: "Mozilla/5.0 (Macintosh)",
  });
  assert.equal(headers.authorization, "Bearer token-value");
  assert.equal(headers["x-device-id"], "device-value");
  assert.equal(headers["x-forwarded-for"], "203.0.113.7");
  assert.equal(headers["x-device-name"], "Mozilla/5.0 (Macintosh)");
});

test("отсутствующие значения не превращаются в пустые заголовки", () => {
  const headers = buildHeaders({ path: "/x" });
  assert.equal("authorization" in headers, false);
  assert.equal("x-forwarded-for" in headers, false);
  assert.equal("x-device-id" in headers, false);
});

test("имя устройства обрезается: сервер хранит его как название сессии", () => {
  const headers = buildHeaders({ path: "/x", userAgent: "a".repeat(400) });
  assert.equal(headers["x-device-name"].length, 120);
});

test("успешный ответ разбирается как JSON", async () => {
  process.env.MYTAMGA_API_URL = "https://api.test";
  const result = await callApi<{ ok: boolean }>(
    { path: "/api/billing/plans" },
    async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
  );
  assert.deepEqual(result, { ok: true });
});

test("пустой ответ не считается поломкой", async () => {
  process.env.MYTAMGA_API_URL = "https://api.test";
  const result = await callApi({ path: "/x", method: "POST" }, async () =>
    new Response(null, { status: 204 }),
  );
  assert.equal(result, null);
});

test("код ошибки и тело доходят до вызывающего", async () => {
  process.env.MYTAMGA_API_URL = "https://api.test";
  await assert.rejects(
    () =>
      callApi(
        { path: "/x" },
        async () =>
          new Response(JSON.stringify({ retryAfterMs: 5000 }), { status: 429 }),
      ),
    (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 429);
      assert.deepEqual(error.body, { retryAfterMs: 5000 });
      return true;
    },
  );
});

test("без адреса API запрос не уходит, а честно отказывает", async () => {
  delete process.env.MYTAMGA_API_URL;
  await assert.rejects(
    () => callApi({ path: "/x" }, async () => new Response("{}", { status: 200 })),
    (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 503);
      return true;
    },
  );
});
