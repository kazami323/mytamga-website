import { test } from "node:test";
import assert from "node:assert/strict";

import { COMPANY, missingCompanyFields } from "../lib/legal/company.ts";

test("адрес поддержки — настоящий, он есть в текстах приложения", () => {
  assert.equal(COMPANY.supportEmail, "support@mytamga.uz");
});

test("незаполненные реквизиты перечисляются по имени", () => {
  const missing = missingCompanyFields();
  assert.ok(missing.includes("legalName"));
  assert.ok(missing.includes("taxId"));
  assert.ok(missing.includes("address"));
});

test("поддержка в список незаполненных не попадает", () => {
  assert.equal(missingCompanyFields().includes("supportEmail"), false);
});

test("заглушка отличима от значения программно, а не на глаз", () => {
  // Иначе проверка перед запуском зависит от того, что кто-то перечитал файл.
  assert.equal(COMPANY.legalName, null);
});
