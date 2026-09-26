import { test } from "node:test";
import assert from "node:assert/strict";

import { createThrottle } from "../lib/api/throttle.ts";

test("первый запрос проходит", () => {
  const throttle = createThrottle(30_000);
  assert.deepEqual(throttle.check("998901234567", 1000), {
    allowed: true,
    retryAfterMs: 0,
  });
});

test("повтор в окне отклоняется и говорит, сколько ждать", () => {
  const throttle = createThrottle(30_000);
  throttle.check("998901234567", 1000);
  assert.deepEqual(throttle.check("998901234567", 6000), {
    allowed: false,
    retryAfterMs: 25_000,
  });
});

test("после окна запрос снова проходит", () => {
  const throttle = createThrottle(30_000);
  throttle.check("998901234567", 1000);
  assert.equal(throttle.check("998901234567", 31_000).allowed, true);
});

test("разные номера не мешают друг другу", () => {
  const throttle = createThrottle(30_000);
  throttle.check("998901234567", 1000);
  assert.equal(throttle.check("998907654321", 1000).allowed, true);
});
