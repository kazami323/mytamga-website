import { test } from "node:test";
import assert from "node:assert/strict";

import { authorizedCall } from "../lib/api/authorized-call.ts";
import { ApiError } from "../lib/api/errors.ts";
import type { ApiCall } from "../lib/api/server.ts";

const context = {
  accessToken: "access-1",
  refreshToken: "refresh-1",
  deviceId: "device-1",
  clientIp: "203.0.113.7",
  userAgent: "Mozilla/5.0",
};

/** Записывает вызовы и отвечает по сценарию. */
function caller(script: Array<unknown | ApiError>) {
  const calls: ApiCall[] = [];
  const impl = async <R,>(call: ApiCall): Promise<R> => {
    calls.push(call);
    const next = script.shift();
    if (next instanceof ApiError) {
      throw next;
    }
    return next as R;
  };
  return { calls, impl };
}

test("с живым токеном делает один запрос и токены не меняет", async () => {
  const { calls, impl } = caller([{ ok: true }]);

  const result = await authorizedCall<{ ok: boolean }>(
    context,
    { path: "/api/organizations/current/subscription" },
    impl,
  );

  assert.deepEqual(result.data, { ok: true });
  assert.equal(result.tokens, undefined);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].accessToken, "access-1");
  // Устройство и адрес клиента подставляются из контекста, а не теряются.
  assert.equal(calls[0].deviceId, "device-1");
  assert.equal(calls[0].clientIp, "203.0.113.7");
});

test("на 401 обновляется по refresh и повторяет запрос один раз", async () => {
  const { calls, impl } = caller([
    new ApiError(401, { error: "expired" }),
    { accessToken: "access-2", refreshToken: "refresh-2" },
    { ok: true },
  ]);

  const result = await authorizedCall<{ ok: boolean }>(context, { path: "/x" }, impl);

  assert.deepEqual(result.data, { ok: true });
  assert.deepEqual(result.tokens, { accessToken: "access-2", refreshToken: "refresh-2" });
  assert.equal(calls.length, 3);
  assert.equal(calls[1].path, "/api/auth/refresh");
  assert.deepEqual(calls[1].body, { refreshToken: "refresh-1" });
  // Повтор идёт с новым токеном, а не со старым.
  assert.equal(calls[2].accessToken, "access-2");
});

test("без обоих токенов в API не ходим вовсе", async () => {
  const { calls, impl } = caller([{ ok: true }]);

  await assert.rejects(
    () => authorizedCall({ ...context, accessToken: undefined, refreshToken: undefined }, { path: "/x" }, impl),
    (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 401);
      return true;
    },
  );
  assert.equal(calls.length, 0);
});

test("401 без refresh-токена пробрасывается, а не превращается в обновление", async () => {
  const { calls, impl } = caller([new ApiError(401, { error: "expired" })]);

  await assert.rejects(
    () => authorizedCall({ ...context, refreshToken: undefined }, { path: "/x" }, impl),
    (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 401);
      return true;
    },
  );
  assert.equal(calls.length, 1);
});

test("неудачное обновление даёт истёкшую сессию и повтора не делает", async () => {
  const { calls, impl } = caller([
    new ApiError(401, { error: "expired" }),
    new ApiError(401, { error: "refresh dead" }),
  ]);

  await assert.rejects(
    () => authorizedCall(context, { path: "/x" }, impl),
    (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 401);
      return true;
    },
  );
  assert.equal(calls.length, 2);
});

test("обновление без токена в ответе не считается успешным", async () => {
  const { calls, impl } = caller([
    new ApiError(401, { error: "expired" }),
    { refreshToken: "refresh-2" },
  ]);

  await assert.rejects(() => authorizedCall(context, { path: "/x" }, impl));
  assert.equal(calls.length, 2);
});

test("ошибка не 401 пробрасывается без попытки обновления", async () => {
  const { calls, impl } = caller([new ApiError(409, { error: "store" })]);

  await assert.rejects(
    () => authorizedCall(context, { path: "/x" }, impl),
    (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 409);
      return true;
    },
  );
  assert.equal(calls.length, 1);
});
