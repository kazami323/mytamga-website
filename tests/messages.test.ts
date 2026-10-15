import { test } from "node:test";
import assert from "node:assert/strict";

import { messageFor } from "../lib/billing/messages.ts";

const strings = {
  rate: "Слишком часто. Повторите через {seconds} с.",
  rateLater: "Слишком часто. Попробуйте позже.",
  forbidden: "Оплату оформляет владелец организации.",
  store: "Подписка оформлена в магазине приложений.",
  unavailable: "Онлайн-оплата подключается.",
  requestOnly: "Этот тариф оформляется по заявке.",
  noOrganization: "Организация не найдена.",
  signedOut: "Сессия истекла.",
  network: "Не удалось связаться с сервером.",
  phoneInvalid: "Проверьте номер.",
  codeInvalid: "Код из SMS — шесть цифр.",
  pricesPending: "Оплата пока не открыта.",
  checkoutConflict: "Этот тариф сейчас оплатить нельзя.",
};

test("секунды подставляются в сообщение о частоте", () => {
  assert.equal(messageFor("rate", 30, strings), "Слишком часто. Повторите через 30 с.");
});

test("без числа секунд берётся сообщение без числа", () => {
  assert.equal(messageFor("rate", null, strings), "Слишком часто. Попробуйте позже.");
  assert.equal(messageFor("rate", undefined, strings), "Слишком часто. Попробуйте позже.");
});

test("остальные коды переводятся прямо", () => {
  assert.equal(messageFor("forbidden", null, strings), strings.forbidden);
  assert.equal(messageFor("store", null, strings), strings.store);
  assert.equal(messageFor("pricesPending", null, strings), strings.pricesPending);
  assert.equal(messageFor("checkoutConflict", null, strings), strings.checkoutConflict);
});

test("неизвестный код не оставляет человека без объяснения", () => {
  // Сервер может однажды ответить кодом, которого мы не знаем.
  assert.equal(
    messageFor("что-то новое" as never, null, strings),
    strings.network,
  );
});
