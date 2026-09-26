import { test } from "node:test";
import assert from "node:assert/strict";

import { DOCUMENTS } from "../lib/legal/documents.ts";

test("русские документы есть все три", () => {
  assert.ok(DOCUMENTS.ru?.offer);
  assert.ok(DOCUMENTS.ru?.privacy);
  assert.ok(DOCUMENTS.ru?.terms);
});

test("остальных языков пока нет — страница покажет уведомление", () => {
  assert.equal(DOCUMENTS.uz, undefined);
  assert.equal(DOCUMENTS.en, undefined);
  assert.equal(DOCUMENTS.zh, undefined);
});

test("ни один документ не пуст и у каждого есть дата", () => {
  for (const [slug, document] of Object.entries(DOCUMENTS.ru ?? {})) {
    assert.ok(document.blocks.length > 0, `${slug}: нет содержимого`);
    assert.match(document.updated, /^\d{4}-\d{2}-\d{2}$/, `${slug}: нет даты`);
  }
});

test("политика и условия несут текст из приложения, а не пересказ", () => {
  const privacy = JSON.stringify(DOCUMENTS.ru?.privacy);
  // Две фразы-маркеры: если текст в приложении изменится, check:legal заметит.
  assert.ok(privacy.includes("Полные реквизиты банковских карт MyTamga не хранит"));
  assert.ok(privacy.includes("Профиль → «Удалить аккаунт»"));

  const terms = JSON.stringify(DOCUMENTS.ru?.terms);
  assert.ok(terms.includes("Стоимость и состав тарифа показываются до оплаты"));
});

test("оферта помечена черновиком, пока её не видел юрист", () => {
  assert.equal(DOCUMENTS.ru?.offer.isDraft, true);
  // Политика и условия черновиком не считаются: они уже действуют в приложении.
  assert.equal(DOCUMENTS.ru?.privacy.isDraft, false);
});
