import { test } from "node:test";
import assert from "node:assert/strict";

import {
  createLeadRateLimiter,
  sendLeadToTelegram,
  TELEGRAM_TEXT_LIMIT,
} from "../lib/lead-delivery.ts";

const LEAD = {
  name: "Иван",
  contact: "ivan@example.com",
  company: "ООО Ромашка",
  goods: "Швейные машины из Китая, 20 штук",
};
const ENV = { LEAD_TELEGRAM_BOT_TOKEN: "123:SECRET", LEAD_TELEGRAM_CHAT_ID: "-100" };
const NOW = new Date("2026-10-15T10:00:00Z");

function fakeFetch(...steps: Array<number | Error>) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const impl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const step = steps[Math.min(calls.length - 1, steps.length - 1)];
    if (step instanceof Error) throw step;
    return new Response(JSON.stringify({ ok: step === 200 }), { status: step });
  }) as unknown as typeof fetch;
  return { impl, calls };
}

test("не настроено — unavailable, fetch не вызывается", async () => {
  const { impl, calls } = fakeFetch(200);
  assert.equal(
    await sendLeadToTelegram(LEAD, { env: {}, fetchImpl: impl }),
    "unavailable",
  );
  assert.equal(
    await sendLeadToTelegram(LEAD, {
      env: { LEAD_TELEGRAM_BOT_TOKEN: "x" },
      fetchImpl: impl,
    }),
    "unavailable",
  );
  assert.equal(calls.length, 0);
});

test("успех — delivered; URL и тело верны, токена в теле нет", async () => {
  const { impl, calls } = fakeFetch(200);
  const result = await sendLeadToTelegram(LEAD, {
    env: ENV,
    fetchImpl: impl,
    lang: "ru",
    now: NOW,
  });
  assert.equal(result, "delivered");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.telegram.org/bot123:SECRET/sendMessage");
  assert.equal(calls[0].init.method, "POST");
  const raw = String(calls[0].init.body);
  const body = JSON.parse(raw);
  assert.equal(body.chat_id, "-100");
  assert.equal(body.disable_web_page_preview, true);
  assert.equal("parse_mode" in body, false);
  assert.equal(raw.includes("SECRET"), false);
  for (const part of [
    "Новая заявка с сайта",
    "Имя: Иван",
    "Контакт: ivan@example.com",
    "Компания: ООО Ромашка",
    "Что везёте: Швейные машины",
    "ru",
    "2026-10-15T10:00:00.000Z",
  ]) {
    assert.ok(body.text.includes(part), part);
  }
});

test("без компании строки «Компания» нет", async () => {
  const { impl, calls } = fakeFetch(200);
  await sendLeadToTelegram({ ...LEAD, company: "" }, { env: ENV, fetchImpl: impl });
  assert.equal(JSON.parse(String(calls[0].init.body)).text.includes("Компания"), false);
});

test("4xx — без повтора", async () => {
  const { impl, calls } = fakeFetch(400);
  assert.equal(
    await sendLeadToTelegram(LEAD, { env: ENV, fetchImpl: impl }),
    "failed",
  );
  assert.equal(calls.length, 1);
});

test("5xx — один повтор; успех со второй попытки", async () => {
  const { impl, calls } = fakeFetch(502, 200);
  assert.equal(
    await sendLeadToTelegram(LEAD, { env: ENV, fetchImpl: impl }),
    "delivered",
  );
  assert.equal(calls.length, 2);
});

test("5xx дважды — unavailable, ровно две попытки", async () => {
  const { impl, calls } = fakeFetch(500);
  assert.equal(
    await sendLeadToTelegram(LEAD, { env: ENV, fetchImpl: impl }),
    "failed",
  );
  assert.equal(calls.length, 2);
});

test("429 — повтор", async () => {
  const { impl, calls } = fakeFetch(429, 200);
  assert.equal(
    await sendLeadToTelegram(LEAD, { env: ENV, fetchImpl: impl }),
    "delivered",
  );
  assert.equal(calls.length, 2);
});

test("сетевая ошибка — повтор", async () => {
  const { impl, calls } = fakeFetch(new Error("boom 123:SECRET"), 200);
  assert.equal(
    await sendLeadToTelegram(LEAD, { env: ENV, fetchImpl: impl }),
    "delivered",
  );
  assert.equal(calls.length, 2);
});

test("текст обрезается до 4000 символов", async () => {
  const { impl, calls } = fakeFetch(200);
  await sendLeadToTelegram(
    { ...LEAD, goods: "я".repeat(9000) },
    { env: ENV, fetchImpl: impl },
  );
  const { text } = JSON.parse(String(calls[0].init.body));
  assert.equal(Array.from(text as string).length, TELEGRAM_TEXT_LIMIT);
});

test("токен и заявка не попадают в лог", async () => {
  const logged: string[] = [];
  const original = console.error;
  console.error = (...args: unknown[]) => logged.push(args.join(" "));
  try {
    const { impl } = fakeFetch(new Error("x 123:SECRET"));
    await sendLeadToTelegram(LEAD, { env: ENV, fetchImpl: impl });
  } finally {
    console.error = original;
  }
  const all = logged.join("\n");
  assert.ok(all.length > 0);
  assert.equal(all.includes("SECRET"), false);
  assert.equal(all.includes("ivan@example.com"), false);
});

test("лимит: шестая заявка с IP за 10 минут отклонена, другой IP проходит", () => {
  const limiter = createLeadRateLimiter();
  for (let i = 0; i < 5; i++) assert.equal(limiter.take("1.1.1.1", 1000 + i), true);
  assert.equal(limiter.take("1.1.1.1", 2000), false);
  assert.equal(limiter.take("2.2.2.2", 2000), true);
});

test("лимит: окно 10 минут истекает", () => {
  const limiter = createLeadRateLimiter();
  for (let i = 0; i < 5; i++) limiter.take("1.1.1.1", 1000);
  assert.equal(limiter.take("1.1.1.1", 1000 + 599_000), false);
  assert.equal(limiter.take("1.1.1.1", 1000 + 600_000), true);
});

test("лимит: не более 30 за 10 минут со всех адресов", () => {
  const limiter = createLeadRateLimiter();
  for (let i = 0; i < 30; i++) assert.equal(limiter.take(`ip-${i}`, 1000), true);
  assert.equal(limiter.take("fresh", 2000), false);
  assert.equal(limiter.take("fresh", 1000 + 600_000), true);
});

test("лимит: без адреса действует только общий лимит", () => {
  const limiter = createLeadRateLimiter();
  // Больше пяти без адреса проходят: на IP лимита нет.
  for (let i = 0; i < 30; i++) assert.equal(limiter.take(null, 1000), true);
  assert.equal(limiter.take(null, 2000), false);
  assert.equal(limiter.size, 0);
});

test("лимит: отказы и истечение окна не раздувают память", () => {
  const limiter = createLeadRateLimiter();
  for (let i = 0; i < 30; i++) limiter.take(`ip-${i}`, 1000);
  for (let i = 0; i < 200; i++) limiter.take(`spam-${i}`, 2000); // все отказы
  assert.equal(limiter.size, 30);
  limiter.take("later", 1000 + 600_000);
  assert.equal(limiter.size, 1);
});

test("обрезка не разрывает суррогатную пару на границе", async () => {
  const { impl, calls } = fakeFetch(200);
  await sendLeadToTelegram(
    { ...LEAD, goods: "😀".repeat(5000) },
    { env: ENV, fetchImpl: impl },
  );
  const { text } = JSON.parse(String(calls[0].init.body));
  const chars = Array.from(text as string);
  assert.equal(chars.length, TELEGRAM_TEXT_LIMIT);
  assert.equal(chars[chars.length - 1], "😀");
  assert.equal(/[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/.test(text), false);
});
