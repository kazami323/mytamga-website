import { test } from "node:test";
import assert from "node:assert/strict";

import { COOKIE, MAX_AGE, clearedCookieOptions, cookieOptions } from "../lib/api/cookies.ts";

test("имена кук не пересекаются и не совпадают с локальной кукой языка", () => {
  const names: string[] = Object.values(COOKIE);
  assert.equal(new Set(names).size, names.length);
  assert.ok(!names.includes("NEXT_LOCALE"));
});

test("куки недоступны браузерному скрипту и живут на всём сайте", () => {
  const options = cookieOptions(MAX_AGE.access);
  assert.equal(options.httpOnly, true);
  assert.equal(options.secure, true);
  assert.equal(options.path, "/");
});

test("SameSite именно lax: возврат с оплаты приходит с чужого домена", () => {
  // strict срезал бы сессию ровно в тот момент, когда надо показать результат.
  assert.equal(cookieOptions(MAX_AGE.access).sameSite, "lax");
});

test("срок жизни передаётся как есть", () => {
  assert.equal(cookieOptions(900).maxAge, 900);
  assert.equal(MAX_AGE.access, 900);
});

test("устройство помнится долго, номер платежа — час", () => {
  assert.equal(MAX_AGE.device, 31_536_000);
  assert.equal(MAX_AGE.transaction, 3600);
});

test("удаление куки сохраняет остальные флаги", () => {
  const options = clearedCookieOptions();
  assert.equal(options.maxAge, 0);
  assert.equal(options.httpOnly, true);
  assert.equal(options.path, "/");
});
