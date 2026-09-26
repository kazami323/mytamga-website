import { test } from "node:test";
import assert from "node:assert/strict";

import { clientIpFrom } from "../lib/api/forwarded.ts";

test("берёт ПРАВОЕ звено цепочки — его добавил доверенный прокси", () => {
  // Обратный порядок был дырой: левую часть цепочки присылает сам клиент, и
  // подделав её, он сбрасывал серверный лимит входа. Caddy дописывает
  // настоящий адрес справа, поэтому доверять можно только правому звену.
  assert.equal(clientIpFrom("1.2.3.4, 10.0.0.2, 203.0.113.7"), "203.0.113.7");
});

test("подделанное левое звено больше не побеждает", () => {
  assert.equal(clientIpFrom("203.0.113.9, 198.51.100.7"), "198.51.100.7");
});

test("единственное звено и есть клиент", () => {
  assert.equal(clientIpFrom("203.0.113.7"), "203.0.113.7");
});

test("пробелы и пустые звенья не мешают", () => {
  assert.equal(clientIpFrom("  , 1.2.3.4 , 203.0.113.7 "), "203.0.113.7");
});

test("IPv6 остаётся целым, скобки и порт снимаются", () => {
  assert.equal(clientIpFrom("2001:db8::1"), "2001:db8::1");
  assert.equal(clientIpFrom("[2001:db8::1]:443"), "2001:db8::1");
  assert.equal(clientIpFrom("203.0.113.7:54321"), "203.0.113.7");
});

test("правое звено не похоже на адрес — цепочке не верим вовсе", () => {
  // Прокси всегда дописывает настоящий адрес. Если справа не адрес, значит
  // прокси не дописал, и вся цепочка пришла от клиента.
  assert.equal(clientIpFrom("203.0.113.7, not-an-ip"), null);
  assert.equal(clientIpFrom("not-an-ip"), null);
  assert.equal(clientIpFrom("999.999.999.999"), null);
});

test("без цепочки берётся x-real-ip, но только если это адрес", () => {
  assert.equal(clientIpFrom(null, "203.0.113.9"), "203.0.113.9");
  assert.equal(clientIpFrom(null, "кто-то"), null);
});

test("без обоих заголовков адреса нет", () => {
  assert.equal(clientIpFrom(null, null), null);
  assert.equal(clientIpFrom("", ""), null);
  assert.equal(clientIpFrom(" , , "), null);
});
