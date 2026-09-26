import { test } from "node:test";
import assert from "node:assert/strict";

import { createSingleFlight } from "../lib/api/single-flight.ts";

test("одновременные вызовы с одним ключом выполняют работу один раз", async () => {
  // Сервер приложения меняет refresh-токен при каждом обновлении, поэтому два
  // параллельных обновления одним токеном означали бы, что проигравший получит
  // 401 по живой сессии — и снёс бы куки, которые победитель только выдал.
  const run = createSingleFlight<string>();
  let calls = 0;

  const task = async () => {
    calls += 1;
    await new Promise((resolve) => setTimeout(resolve, 10));
    return "tokens";
  };

  const [a, b] = await Promise.all([run("rt-1", task), run("rt-1", task)]);

  assert.equal(calls, 1);
  assert.equal(a, "tokens");
  assert.equal(b, "tokens");
});

test("разные ключи не делят работу", async () => {
  const run = createSingleFlight<string>();
  let calls = 0;
  const task = async () => {
    calls += 1;
    return "tokens";
  };

  await Promise.all([run("rt-1", task), run("rt-2", task)]);

  assert.equal(calls, 2);
});

test("после завершения следующий вызов работает заново", async () => {
  const run = createSingleFlight<string>();
  let calls = 0;
  const task = async () => {
    calls += 1;
    return "tokens";
  };

  await run("rt-1", task);
  await run("rt-1", task);

  assert.equal(calls, 2);
});

test("отказ достаётся обоим и не залипает", async () => {
  const run = createSingleFlight<string>();
  let calls = 0;
  const failing = async (): Promise<string> => {
    calls += 1;
    throw new Error("refresh dead");
  };

  const results = await Promise.allSettled([run("rt-1", failing), run("rt-1", failing)]);

  assert.equal(calls, 1);
  assert.deepEqual(results.map((r) => r.status), ["rejected", "rejected"]);

  // Залипший отказ запретил бы повторную попытку навсегда.
  await assert.rejects(() => run("rt-1", failing));
  assert.equal(calls, 2);
});
