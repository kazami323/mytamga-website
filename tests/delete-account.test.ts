import { test } from "node:test";
import assert from "node:assert/strict";

import { DELETE_ACCOUNT } from "../lib/legal/delete-account.ts";
import { COMPANY } from "../lib/legal/company.ts";

const LOCALES = ["ru", "uz", "en", "zh"] as const;

function allText(locale: (typeof LOCALES)[number]): string {
  const c = DELETE_ACCOUNT[locale];
  return [
    c.title,
    c.description,
    c.intro,
    ...c.sections.flatMap((s) => [s.heading, ...(s.paragraphs ?? []), ...(s.steps ?? []), ...(s.items ?? [])]),
  ].join("\n");
}

test("страница удаления аккаунта есть на всех четырёх языках с разделами", () => {
  for (const locale of LOCALES) {
    const c = DELETE_ACCOUNT[locale];
    assert.ok(c.title && c.description && c.linkLabel, locale);
    assert.equal(c.sections.length, 6, locale);
    assert.ok(c.sections.some((s) => s.steps && s.steps.length === 3), locale);
    assert.equal(c.sections.filter((s) => s.mail).length, 1, locale);
  }
});

test("в каждом языке есть адрес поддержки и упоминание App Store и Google Play", () => {
  for (const locale of LOCALES) {
    const text = allText(locale);
    assert.ok(text.includes(COMPANY.supportEmail), locale);
    assert.ok(text.includes("App Store"), locale);
    assert.ok(text.includes("Google Play"), locale);
    assert.ok(text.includes("30"), locale);
  }
});

test("текст не просит прислать пароль или код, а прямо запрещает это", () => {
  const forbidden = [
    /(пришл|отправ|укаж|сообщ)\S*\s+(свой\s+)?(пароль|код)/i,
    /(yubor|ko‘rsat)\S*\s+(parol|sms)/i,
    /(send|provide|share)\s+(us\s+)?(your\s+)?(password|code)/i,
    /(发送|提供)(您的)?(密码|验证码)/,
  ];
  for (const locale of LOCALES) {
    const text = allText(locale);
    for (const pattern of forbidden) {
      assert.ok(!pattern.test(text.replace(/(Никогда|Never|hech qachon|请勿)[^\n]*/gi, "")), `${locale}: ${pattern}`);
    }
    // Предупреждение «не присылайте» присутствует.
    assert.match(text, /(Никогда не присылайте|Never send|Xatda hech qachon|请勿通过邮件发送)/, locale);
  }
});
