import { test } from "node:test";
import assert from "node:assert/strict";

import { clientIpFrom } from "../lib/api/forwarded.ts";

test("берёт левый адрес цепочки — клиента, а не прокси", () => {
  assert.equal(clientIpFrom("203.0.113.7, 10.0.0.2, 127.0.0.1"), "203.0.113.7");
});

test("единственный адрес и есть клиент", () => {
  assert.equal(clientIpFrom("203.0.113.7"), "203.0.113.7");
});

test("пробелы и пустые звенья не мешают", () => {
  assert.equal(clientIpFrom("  , 203.0.113.7 , 10.0.0.2"), "203.0.113.7");
});

test("IPv6 в цепочке остаётся целым", () => {
  assert.equal(clientIpFrom("2001:db8::1, 10.0.0.2"), "2001:db8::1");
});

test("без цепочки берётся x-real-ip", () => {
  assert.equal(clientIpFrom(null, "203.0.113.9"), "203.0.113.9");
});

test("без обоих заголовков адреса нет", () => {
  assert.equal(clientIpFrom(null, null), null);
  assert.equal(clientIpFrom("", ""), null);
  assert.equal(clientIpFrom(" , , "), null);
});
