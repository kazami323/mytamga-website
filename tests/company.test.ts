import { test } from "node:test";
import assert from "node:assert/strict";

import { COMPANY, companyFor, companyLine, missingCompanyFields } from "../lib/legal/company.ts";

test("адрес поддержки — настоящий, он есть в текстах приложения", () => {
  assert.equal(COMPANY.supportEmail, "support@mytamga.uz");
});

test("реквизиты заполнены — проверке перед запуском больше нечего перечислять", () => {
  assert.deepEqual(missingCompanyFields(), []);
});

test("название юрлица — в форме своего языка", () => {
  assert.equal(companyFor("ru").legalName, "MY TAMGA APP, MCHJ (ООО)");
  assert.equal(companyFor("uz").legalName, "MY TAMGA APP, MCHJ");
  assert.equal(companyFor("en").legalName, "MY TAMGA APP, MCHJ (LLC)");
  for (const locale of ["ru", "uz", "en", "zh"] as const) {
    assert.ok(companyFor(locale).legalName.startsWith("MY TAMGA APP, MCHJ"));
  }
});

test("китайская страница показывает английскую форму, а не самодельный перевод", () => {
  // Регистрационные данные — юридические идентификаторы. Неофициальная
  // китайская передача хуже английской формы, которую дал владелец.
  assert.deepEqual(companyFor("zh"), companyFor("en"));
});

test("ИНН один на все языки, меняется подпись к нему", () => {
  for (const locale of ["ru", "uz", "en", "zh"] as const) {
    assert.equal(companyFor(locale).taxId, "313333116");
  }
  assert.equal(companyFor("ru").taxLabel, "ИНН");
  assert.equal(companyFor("uz").taxLabel, "STIR");
  assert.equal(companyFor("en").taxLabel, "TIN");
});

test("адрес во всех языках — точная строка из D-U-N-S", () => {
  const exact = "Daryoboyi MFY, Daryoboyi 7-tor kochasi 18a, Tashkent, Tashkent City 100155";
  for (const locale of ["ru", "uz", "en", "zh"] as const) {
    assert.equal(companyFor(locale).address, exact);
    assert.equal(companyFor(locale).shortAddress, exact);
  }
});

test("ссылка для звонка набирает тот же номер, что показан", () => {
  const shown = companyFor("ru").phone.replace(/\D/g, "");
  const dialed = companyFor("ru").phoneHref.replace(/\D/g, "");
  assert.equal(shown, "998915720509");
  assert.equal(dialed, shown);
});

test("строка подвала собирается из реквизитов, а не пишется заново", () => {
  const addr = "Daryoboyi MFY, Daryoboyi 7-tor kochasi 18a, Tashkent, Tashkent City 100155";
  assert.equal(companyLine("ru"), `MY TAMGA APP, MCHJ (ООО) · ИНН 313333116 · ${addr}`);
  assert.equal(companyLine("uz"), `MY TAMGA APP, MCHJ · STIR 313333116 · ${addr}`);
  assert.equal(companyLine("en"), `MY TAMGA APP, MCHJ (LLC) · TIN 313333116 · ${addr}`);
});
