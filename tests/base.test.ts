import { test } from "node:test";
import assert from "node:assert/strict";

import { apiUrl } from "../lib/api/base.ts";

test("склеивает адрес без двойного слеша", () => {
  process.env.MYTAMGA_API_URL = "https://api.mytamga.uz";
  assert.equal(apiUrl("/api/billing/plans"), "https://api.mytamga.uz/api/billing/plans");
});

test("лишний слеш в переменной не удваивается", () => {
  process.env.MYTAMGA_API_URL = "https://api.mytamga.uz/";
  assert.equal(apiUrl("/api/billing/plans"), "https://api.mytamga.uz/api/billing/plans");
});

test("без переменной окружения адреса нет", () => {
  delete process.env.MYTAMGA_API_URL;
  assert.equal(apiUrl("/api/billing/plans"), null);
});

test("пустая переменная — тоже отсутствие адреса", () => {
  process.env.MYTAMGA_API_URL = "   ";
  assert.equal(apiUrl("/api/billing/plans"), null);
});
