import { test } from "node:test";
import assert from "node:assert/strict";

import { ApiError, checkoutConflictFrom, errorCodeFor } from "../lib/api/errors.ts";
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

test("смысл 400 задаёт вызывающий: на разных ручках он разный", () => {
  // API отвечает 400 и на неверный SMS-код, и на непродаваемый тариф. Один
  // общий перевод сказал бы человеку, опечатавшемуся в коде, «этот тариф
  // оформляется по заявке» — неправду на самом входе.
  assert.equal(errorCodeFor(400), "requestOnly");
  assert.equal(errorCodeFor(400, "codeInvalid"), "codeInvalid");
  assert.equal(errorCodeFor(400, "phoneInvalid"), "phoneInvalid");
  // Переопределение касается только 400.
  assert.equal(errorCodeFor(409, "codeInvalid"), "store");
  assert.equal(errorCodeFor(409, "requestOnly", "checkoutConflict"), "checkoutConflict");
  assert.equal(errorCodeFor(429, "codeInvalid"), "rate");
});

test("наши собственные коды из ответа API не выводятся", () => {
  // phoneInvalid, codeInvalid и pricesPending ставим мы сами, до запроса.
  // Без стрелки map передал бы вторым аргументом индекс — то есть смысл 400.
  const fromApi = [400, 401, 403, 404, 409, 429, 500, 503].map((status) =>
    errorCodeFor(status),
  );
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

test("без задержки в ответе число не выдумывается", () => {
  // API на самом деле её не присылает: глобальный фильтр исключений оставляет
  // в теле только { error, requestId }. Сказать «повторите через 1 с», когда
  // ждать пятнадцать минут, — соврать человеку на входе.
  assert.equal(retryAfterSeconds({}), null);
  assert.equal(retryAfterSeconds({ retryAfterMs: 0 }), null);
  assert.equal(retryAfterSeconds({ retryAfterMs: -5000 }), null);
});

test("нечитаемое тело тоже не даёт числа", () => {
  assert.equal(retryAfterSeconds(null), null);
  assert.equal(retryAfterSeconds("слишком часто"), null);
  assert.equal(retryAfterSeconds({ retryAfterMs: "минуту" }), null);
  assert.equal(retryAfterSeconds({ error: "Too many attempts", requestId: "x" }), null);
});

test("неправдоподобно большая задержка не называется в секундах", () => {
  // Десять минут — предел, после которого «повторите через N секунд» перестаёт
  // быть полезным: человеку говорят «позже», без числа.
  assert.equal(retryAfterSeconds({ retryAfterMs: 600_000 }), 600);
  assert.equal(retryAfterSeconds({ retryAfterMs: 600_001 }), null);
  assert.equal(retryAfterSeconds({ retryAfterMs: 10_800_000 }), null);
});

test("три 409 кассы опознаются по тексту сервера", () => {
  assert.deepEqual(
    checkoutConflictFrom({ message: "Подписка организации оформлена через App Store или Google Play. Управлять ею можно в настройках магазина." }),
    { code: "store", detail: null },
  );
  assert.deepEqual(
    checkoutConflictFrom({ message: "Тариф организации действует бессрочно: оплатить можно только более широкий тариф." }),
    { code: "checkoutPerpetual", detail: null },
  );
  assert.deepEqual(
    checkoutConflictFrom({ message: "После текущего тарифа уже оплачен тариф Business. Оплатить можно его же или более широкий." }),
    { code: "checkoutScheduled", detail: "Business" },
  );
});

test("неизвестный или небезопасный текст 409 не показывается как есть", () => {
  assert.deepEqual(checkoutConflictFrom({ message: "Что-то новое" }), { code: "checkoutConflict", detail: null });
  assert.deepEqual(checkoutConflictFrom(null), { code: "checkoutConflict", detail: null });
  assert.deepEqual(
    checkoutConflictFrom({ message: "После текущего тарифа уже оплачен тариф <b>x</b>. Оплатить можно" }),
    { code: "checkoutScheduled", detail: null },
  );
});
