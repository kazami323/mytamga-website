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
  assert.equal(companyFor("ru").legalName, "ООО «MY TAMGA APP»");
  assert.equal(companyFor("uz").legalName, '"MY TAMGA APP" MChJ');
  assert.equal(companyFor("en").legalName, "MY TAMGA APP LLC");
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

test("узбекский пишется знаками, которые есть в шрифте сайта", () => {
  // U+02BB и U+02BC формально правильнее, но в Manrope их нет: браузер рисует
  // их системным шрифтом, тоньше и чужеродно. Как во всех словарях — U+2018/U+2019.
  const uz = JSON.stringify(companyFor("uz"));
  assert.equal(/[ʻʼ]/.test(uz), false);
  assert.ok(uz.includes("Daryobo‘yi"));
});

test("ссылка для звонка набирает тот же номер, что показан", () => {
  const shown = companyFor("ru").phone.replace(/\D/g, "");
  const dialed = companyFor("ru").phoneHref.replace(/\D/g, "");
  assert.equal(shown, "998915720509");
  assert.equal(dialed, shown);
});

test("строка подвала собирается из реквизитов, а не пишется заново", () => {
  assert.equal(
    companyLine("ru"),
    "ООО «MY TAMGA APP» · ИНН 313333116 · Ташкент, Сергелийский район, Дарёбуйи, 7-й тупик, 18А",
  );
  assert.equal(
    companyLine("uz"),
    '"MY TAMGA APP" MChJ · STIR 313333116 · Toshkent, Sergeli tumani, Daryobo‘yi 7-tor ko‘chasi, 18A',
  );
  assert.equal(
    companyLine("en"),
    "MY TAMGA APP LLC · TIN 313333116 · 18A, 7th Daryobo'yi Lane, Sergeli District, Tashkent",
  );
});
