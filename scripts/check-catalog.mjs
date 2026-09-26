// Сверка страницы тарифов с каталогом API. Ничего не поднимает сам:
//   npm run dev                                  (сайт, порт 3000)
//   npm --prefix ~/Desktop/Projects/MyTamga run dev:api   (API, порт 3001)
//   npm run check:catalog
//
// Проверяет три вещи:
//   1. каждый тариф каталога есть на странице;
//   2. цены на странице совпадают с каталогом — или, пока они не объявлены,
//      на странице нет ни одной суммы;
//   3. каждый ключ возможностей и лимитов переведён на uz, en и zh.

import { FEATURE_LABELS, LIMIT_LABELS } from "../lib/billing/label-maps.ts";
import { PRICES_PUBLISHED } from "../lib/billing/flags.ts";
import { groupDigits } from "../lib/billing/format.ts";

const SITE = process.env.SITE_URL ?? "http://localhost:3000";
const API = process.env.MYTAMGA_API_URL ?? "http://localhost:3001";
const LOCALES = ["ru", "uz", "en", "zh"];

const failures = [];
const note = (message) => failures.push(message);

const catalog = await fetch(`${API}/api/billing/plans`)
  .then((response) => response.json())
  .catch((error) => {
    note(`каталог не ответил: ${error.message}`);
    return null;
  });

const plans = catalog?.plans ?? [];

if (plans.length === 0) {
  note("каталог пуст — сверять нечего");
}

// 3. Полнота переводов. Каталог — источник ключей, а не наши списки.
for (const locale of ["uz", "en", "zh"]) {
  for (const plan of plans) {
    for (const feature of plan.features ?? []) {
      if (!FEATURE_LABELS[locale]?.[feature.key]) {
        note(`${locale}: нет подписи для возможности ${feature.key}`);
      }
    }
    for (const limit of plan.limits ?? []) {
      if (!LIMIT_LABELS[locale]?.[limit.key]) {
        note(`${locale}: нет подписи для лимита ${limit.key}`);
      }
    }
  }
}

// Текст страницы без разметки: сравниваем то, что видит человек.
const textOf = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    // Схлопываем пробелы, КРОМЕ узкого неразрывного (U+202F): именно им
    // разделены разряды суммы, и `\s` в JavaScript его матчит. Потеряв его,
    // сверка искала бы «39 000» в тексте, где осталось «39 000» с обычным
    // пробелом, и падала бы на каждой цене.
    .replace(/[^\S\u202f]+/g, " ");

for (const locale of LOCALES) {
  const url = `${SITE}/${locale}/pricing`;
  const response = await fetch(url).catch((error) => {
    note(`${url}: страница не ответила — ${error.message}`);
    return null;
  });

  if (!response?.ok) {
    if (response) note(`${url}: ответ ${response.status}`);
    continue;
  }

  const text = textOf(await response.text());

  for (const plan of plans) {
    // 1. Название тарифа.
    if (!text.includes(plan.label)) {
      note(`${locale}: на странице нет тарифа ${plan.label}`);
    }

    // 2. Цены.
    const amounts = [plan.priceMonthly, plan.priceYearly].filter(
      (value) => typeof value === "number" && value > 0,
    );

    for (const amount of amounts) {
      const rendered = groupDigits(amount);
      const isOnPage = text.includes(rendered);

      if (PRICES_PUBLISHED && !isOnPage) {
        note(`${locale}: цена ${rendered} из каталога не найдена на странице`);
      }

      if (!PRICES_PUBLISHED && isOnPage) {
        note(
          `${locale}: цена ${rendered} показана, хотя цены ещё не объявлены — ` +
            "это ровно тот случай, когда сайт и списание расходятся",
        );
      }
    }
  }
}

if (failures.length === 0) {
  console.log(
    `Сверка пройдена: ${plans.length} тариф(ов), ${LOCALES.length} языка, ` +
      `цены ${PRICES_PUBLISHED ? "объявлены и совпадают" : "не объявлены и не показаны"}.`,
  );
  process.exit(0);
}

console.error("Сверка не пройдена:");
for (const failure of failures) {
  console.error(` - ${failure}`);
}
process.exit(1);
