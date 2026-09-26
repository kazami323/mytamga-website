import { test } from "node:test";
import assert from "node:assert/strict";

import { ApiError, errorCodeFor } from "../lib/api/errors.ts";
import { retryAfterSeconds } from "../lib/api/retry.ts";

test("код ответа превращается в код сообщения", () => {
  assert.equal(errorCodeFor(429), "rate");
  assert.equal(errorCodeFor(403), "forbidden");
  assert.equal(errorCodeFor(409), "store");
  assert.equal(errorCodeFor(503), "unavailable");
  assert.equal(errorCodeFor(400), "requestOnly");
  assert.equal(errorCodeFor(404), "noOrganization");
});

test("неизвестный и серверный коды сводятся к сетевой ошибке", () => {
  assert.equal(errorCodeFor(500), "network");
  assert.equal(errorCodeFor(418), "network");
  assert.equal(errorCodeFor(0), "network");
});

test("401 — это не отказ в правах, а истёкшая сессия", () => {
  assert.equal(errorCodeFor(401), "signedOut");
});

test("наши собственные коды из ответа API не выводятся", () => {
  // phoneInvalid, codeInvalid и pricesPending ставим мы сами, до запроса.
  const fromApi = [400, 401, 403, 404, 409, 429, 500, 503].map(errorCodeFor);
  assert.equal(fromApi.includes("phoneInvalid"), false);
  assert.equal(fromApi.includes("codeInvalid"), false);
  assert.equal(fromApi.includes("pricesPending"), false);
});

test("ApiError несёт код и тело ответа", () => {
  const error = new ApiError(409, { message: "store" });
  assert.equal(error.status, 409);
  assert.deepEqual(error.body, { message: "store" });
  assert.ok(error instanceof Error);
});

test("секунды до повтора округляются вверх", () => {
  assert.equal(retryAfterSeconds({ retryAfterMs: 1500 }), 2);
  assert.equal(retryAfterSeconds({ retryAfterMs: 30000 }), 30);
});

test("отсутствующее, нулевое и отрицательное значение дают одну секунду", () => {
  assert.equal(retryAfterSeconds({}), 1);
  assert.equal(retryAfterSeconds({ retryAfterMs: 0 }), 1);
  assert.equal(retryAfterSeconds({ retryAfterMs: -5000 }), 1);
});

test("нечитаемое тело не ломает подсчёт", () => {
  assert.equal(retryAfterSeconds(null), 1);
  assert.equal(retryAfterSeconds("слишком часто"), 1);
  assert.equal(retryAfterSeconds({ retryAfterMs: "минуту" }), 1);
});

test("неправдоподобно большая задержка не называется в секундах", () => {
  // Десять минут — предел, после которого «повторите через N секунд» перестаёт
  // быть полезным: человеку говорят «позже», без числа.
  assert.equal(retryAfterSeconds({ retryAfterMs: 600_000 }), 600);
  assert.equal(retryAfterSeconds({ retryAfterMs: 600_001 }), null);
  assert.equal(retryAfterSeconds({ retryAfterMs: 10_800_000 }), null);
});
