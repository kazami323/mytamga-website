# Billing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Страница тарифов и касса на сайте MyTamga, через которую покупают подписку для приложения, вместе с юридическими страницами, которых требует подключение мерчанта.

**Architecture:** Браузер общается только с `mytamga.uz`. Витрина тарифов — серверный компонент, он тянет публичный каталог API и попадает в HTML. Всё, что требует авторизации, идёт через наши route handlers: они держат токены в куках `HttpOnly` и передают настоящий IP клиента, чтобы серверные лимиты входа считались по посетителю, а не по нашему серверу. Цены пока не объявлены — страница показывает «В процессе обсуждения», и касса включается одним флагом на втором этапе.

**Tech Stack:** Next 16 (App Router, Turbopack), React 19, TypeScript, Tailwind v4, framer-motion, lucide-react. Тесты чистой логики — встроенный `node --test` (Node 22 снимает типы сам). Браузерные проверки — Playwright в scratchpad. **Новых зависимостей не добавляем.**

**Spec:** `docs/superpowers/specs/2026-09-26-billing-page-design.md`

## Global Constraints

- Новых npm-зависимостей не добавлять. Ни `canvas-confetti`, ни `@number-flow/react`, ни примитивов shadcn.
- Ни одной цены, названия тарифа или подписи возможности в коде страницы: всё из `GET /api/billing/plans`.
- Секреты и адреса — в переменных окружения. `MYTAMGA_API_URL` — серверная, без префикса `NEXT_PUBLIC_`.
- `lib/i18n/dictionaries/ru.ts` — источник типа `Dictionary`. Любой новый ключ обязателен во всех четырёх словарях, иначе падает `npm run typecheck`.
- Узбекский пишется через `‘` (U+2018) и `’` (U+2019), не U+02BB/U+02BC: Manrope не несёт для них глифов.
- Черновые переводы помечать `// REVIEW(translation)`, юридические тексты — `REVIEW(legal)`.
- Раскладочные `display` в `app/globals.css` не заводить: файл грузится после Tailwind и при равной специфичности побьёт `md:hidden`.
- `backdrop-filter`: сначала префиксное свойство, потом стандартное — Lightning CSS оставляет последнее.
- Модуль под `"use server"` может экспортировать только async-функции: типы и константы держать в `lib/`.
- Каждый компонент, который монтирует WebGL, обязан вызвать `releaseWebGL` до `dispose()`.
- Модули, покрытые `node --test`, импортируют только относительные пути и встроенные модули: алиас `@/` node не разрешает.
- В таких модулях путь пишется **с расширением** — `./subscription.ts`: node без него не находит файл, а TypeScript без `allowImportingTsExtensions` ругается TS5097. Флаг включается в задаче 1; проверено, что `npm run build` с ним проходит.

## Review Focus

Пять входов, на которых спека молчит, а человек споткнётся. Тест на каждый добавлен в задачу, которая владеет кодом.

1. **Каталог отвечает мусором, 500 или недоступен** — страница показывает «цены недоступны» и контакт поддержки, а не падает на сборке и не рендерит пустую сетку. Тест в задаче 2.
2. **`retryAfterMs` отсутствует, ноль или огромный** — «повторите через N секунд» не должно показывать `NaN`, отрицательное число или 10800 секунд вместо трёх часов. Тест в задаче 4.
3. **Телефон введён как `+998 90 123-45-67`, `8 90 …` или девятью цифрами** — понятная ошибка на странице до обращения к серверу, а не 400 в ответ. Тест в задаче 6.
4. **В каталоге появилась возможность или лимит, которых нет в словаре** — подпись показывается русской из API, карточка не пустеет и сетка не ломается. Тест в задаче 10.
5. **Возврат с оплаты с истёкшей сессией или без куки платежа** — страница просит войти и показывает контакт поддержки, а не крутит опрос минуту в пустоту. Тест в задаче 15.

---

## File Structure

**Чистая логика — покрывается `node --test`, импортов `@/` не содержит:**

| Файл | Ответственность |
| --- | --- |
| `lib/billing/flags.ts` | два флага этапа: объявлены ли цены, есть ли автопродление |
| `lib/billing/format.ts` | группировка разрядов и число платежей в году |
| `lib/billing/catalog.ts` | типы каталога и терпимый разбор ответов API |
| `lib/billing/labels.ts` | подпись по ключу из словаря, с откатом на русскую из API |
| `lib/api/errors.ts` | `ApiError` и отображение кода ответа в код сообщения |
| `lib/api/retry.ts` | человеческое «повторите через…» из `retryAfterMs` |
| `lib/api/phone.ts` | нормализация и проверка узбекского номера |
| `lib/api/throttle.ts` | наш лимит поверх серверного, с внешними часами |
| `lib/api/cookies.ts` | сборка строки `Set-Cookie` с нужными флагами |
| `lib/legal/company.ts` | реквизиты-заглушки и признак незаполненности |

**Серверная обвязка:**

| Файл | Ответственность |
| --- | --- |
| `lib/billing/plans.server.ts` | загрузка каталога и провайдеров с ISR |
| `lib/api/server.ts` | единственное место, знающее адрес API: заголовки, XFF, ошибки |
| `lib/api/session.ts` | чтение и запись кук сессии, повтор после обновления токена |
| `lib/api/origin.ts` | проверка `Origin` на наших POST |

**Маршруты:**

| Файл | Ответственность |
| --- | --- |
| `app/api/session/request-code/route.ts` | запрос SMS-кода |
| `app/api/session/verify-code/route.ts` | проверка кода, выдача кук |
| `app/api/session/refresh/route.ts` | обновление токенов |
| `app/api/session/logout/route.ts` | выход |
| `app/api/subscription/route.ts` | текущая подписка организации |
| `app/api/checkout/route.ts` | создание оплаты, кука с номером платежа |
| `app/api/upgrade-request/route.ts` | заявка на тариф |
| `app/[lang]/pricing/page.tsx` | витрина тарифов и касса |
| `app/[lang]/pay/return/page.tsx` | возврат с оплаты |
| `app/[lang]/offer/page.tsx` | публичная оферта |
| `app/[lang]/privacy/page.tsx` | политика конфиденциальности |
| `app/[lang]/terms/page.tsx` | условия использования |
| `app/[lang]/support/page.tsx` | поддержка |

**Компоненты:**

| Файл | Ответственность |
| --- | --- |
| `components/pricing/plan-grid.tsx` | сетка тарифов, серверный |
| `components/pricing/plan-card.tsx` | одна карточка тарифа, серверный |
| `components/pricing/period-toggle.tsx` | месяц/год на материале `.lss`, клиентский |
| `components/pricing/checkout-panel.tsx` | вход, статус подписки, оплата, клиентский |
| `components/pay/return-poller.tsx` | опрос статуса после оплаты, клиентский |
| `components/legal/legal-document.tsx` | общая оболочка юридической страницы |

**Данные и прочее:**

| Файл | Ответственность |
| --- | --- |
| `lib/legal/documents.ts` | тексты оферты, политики, условий на ru и uz |
| `scripts/check-legal.mjs` | перечисляет незаполненные заглушки |
| `tests/*.test.ts` | тесты чистой логики |

**Изменяемые файлы:** `lib/i18n/dictionaries/{ru,uz,en,zh}.ts` (раздел `billing` и юридические подписи), `components/site-header.tsx` (ссылка на тарифы), `components/site-footer.tsx` (юридические ссылки), `package.json` (скрипты `test` и `check:legal`), `DESIGN.md` (главы «Биллинг», «Окружение», ограничение развёртывания).

---

## Task 1: Каркас тестов и форматирование денег

**Files:**
- Modify: `package.json` (блок `scripts`)
- Create: `lib/billing/format.ts`
- Test: `tests/format.test.ts`

**Interfaces:**
- Consumes: ничего.
- Produces: `groupDigits(value: number): string`, `yearlyMonths(priceMonthly: number, priceYearly: number): number | null`.

- [ ] **Step 1: Настроить запуск тестов**

В `package.json`, в `scripts`, после `"typecheck"`:

```json
    "test": "node --test tests/"
```

Node 22 снимает типы сам, поэтому тесты пишутся прямо на TypeScript и новых
зависимостей не нужно. Но node требует путь с расширением, а TypeScript без
разрешения на это отвечает `TS5097`. Добавить в `tsconfig.json`, в
`compilerOptions`:

```json
    "allowImportingTsExtensions": true,
```

Флаг безопасен: он требует `noEmit`, который здесь уже стоит, и на сборку Next
не влияет — проверено `npm run build`.

- [ ] **Step 2: Написать падающий тест**

Создать `tests/format.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { groupDigits, yearlyMonths } from "../lib/billing/format.ts";

// U+202F, узкий неразрывный пробел — тот же разделитель, что в приложении.
const NNBSP = " ";

test("группирует разряды узким неразрывным пробелом", () => {
  assert.equal(groupDigits(39000), `39${NNBSP}000`);
  assert.equal(groupDigits(2490000), `2${NNBSP}490${NNBSP}000`);
});

test("короткие числа остаются как есть", () => {
  assert.equal(groupDigits(0), "0");
  assert.equal(groupDigits(999), "999");
});

test("дробное и отрицательное не ломают разделитель", () => {
  assert.equal(groupDigits(1234.56), `1${NNBSP}235`);
  assert.equal(groupDigits(-39000), `-39${NNBSP}000`);
});

test("число платежей в году считается из каталога", () => {
  assert.equal(yearlyMonths(39000, 390000), 10);
  assert.equal(yearlyMonths(249000, 2490000), 10);
});

test("бесплатный или отсутствующий год не даёт числа платежей", () => {
  assert.equal(yearlyMonths(0, 0), null);
  assert.equal(yearlyMonths(39000, 0), null);
});
```

- [ ] **Step 3: Убедиться, что тест падает**

Run: `npm test`
Expected: FAIL — `Cannot find module '../lib/billing/format.ts'`

- [ ] **Step 4: Реализовать минимум**

Создать `lib/billing/format.ts`:

```ts
// U+202F. Тот же разделитель разрядов, что в приложении: обычный пробел рвёт
// сумму на переносе, а точка читается как дробная часть.
const NARROW_NO_BREAK_SPACE = " ";

/** Разряды суммы, без названия валюты: слово подставляет словарь. */
export function groupDigits(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  const digits = String(Math.abs(rounded));
  const groups: string[] = [];

  for (let end = digits.length; end > 0; end -= 3) {
    groups.unshift(digits.slice(Math.max(0, end - 3), end));
  }

  return sign + groups.join(NARROW_NO_BREAK_SPACE);
}

/**
 * Сколько месячных платежей стоит год. Считается из каталога, а не вписывается:
 * выгода «два месяца в подарок» должна меняться вместе с ценами.
 * `null` — когда сравнивать нечего: бесплатный тариф или год не предлагается.
 */
export function yearlyMonths(
  priceMonthly: number,
  priceYearly: number,
): number | null {
  if (priceMonthly <= 0 || priceYearly <= 0) {
    return null;
  }

  return Math.round(priceYearly / priceMonthly);
}
```

- [ ] **Step 5: Убедиться, что тесты проходят**

Run: `npm test`
Expected: PASS, пять тестов.

- [ ] **Step 6: Коммит**

```bash
git add package.json lib/billing/format.ts tests/format.test.ts
git commit -m "feat: money formatting for the tariff list"
```

---

## Task 2: Разбор каталога тарифов

**Files:**
- Create: `lib/billing/catalog.ts`
- Test: `tests/catalog.test.ts`

**Interfaces:**
- Consumes: ничего.
- Produces: типы `BillingPlan`, `BillingProvider`, `PlanFeature`, `PlanLimit`; функции `parsePlans(input: unknown): BillingPlan[] | null`, `parseProviders(input: unknown): BillingProvider[] | null`.

Разбор терпимый: в каталоге может появиться поле, о котором мы не знаем, и это не повод ронять страницу. Но структурно чужой ответ даёт `null`, и страница показывает «цены недоступны» — это первый пункт Review Focus.

- [ ] **Step 1: Написать падающий тест**

Создать `tests/catalog.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { parsePlans, parseProviders } from "../lib/billing/catalog.ts";

const plan = {
  key: "pro",
  label: "Pro",
  description: "Для постоянного импорта",
  priceMonthly: 39000,
  priceYearly: 390000,
  priceMonthlyFrom: null,
  currency: "UZS",
  trialDays: 0,
  seatsIncluded: 1,
  extraSeatPriceMonthly: null,
  isRequestOnly: false,
  features: [{ key: "ai_check", label: "AI-проверка" }],
  limits: [
    { key: "team_seats", label: "Мест в команде", value: 1, unlimited: false },
  ],
};

test("разбирает ответ каталога", () => {
  const parsed = parsePlans({ plans: [plan] });
  assert.equal(parsed?.length, 1);
  assert.equal(parsed?.[0].key, "pro");
  assert.equal(parsed?.[0].priceMonthly, 39000);
  assert.equal(parsed?.[0].features[0].key, "ai_check");
  assert.equal(parsed?.[0].limits[0].unlimited, false);
});

test("незнакомые поля не мешают", () => {
  const parsed = parsePlans({ plans: [{ ...plan, somethingNew: 42 }] });
  assert.equal(parsed?.length, 1);
});

test("структурно чужой ответ даёт null, а не пустой список", () => {
  assert.equal(parsePlans(null), null);
  assert.equal(parsePlans({}), null);
  assert.equal(parsePlans({ plans: "pro" }), null);
  assert.equal(parsePlans("<html>502 Bad Gateway</html>"), null);
});

test("тариф без ключа или цены отбрасывается, остальные остаются", () => {
  const parsed = parsePlans({
    plans: [plan, { label: "Сломанный" }, { ...plan, key: "vip", priceMonthly: "дорого" }],
  });
  assert.equal(parsed?.length, 1);
  assert.equal(parsed?.[0].key, "pro");
});

test("пустой каталог — это пустой список, а не отказ", () => {
  assert.deepEqual(parsePlans({ plans: [] }), []);
});

test("разбирает провайдеров и их доступность", () => {
  const parsed = parseProviders({
    providers: [
      { key: "click", label: "Click", status: "active", online: true },
      { key: "payme", label: "Payme", status: "not_connected", online: false },
      { key: "broken" },
    ],
  });
  assert.equal(parsed?.length, 2);
  assert.equal(parsed?.[0].online, true);
  assert.equal(parsed?.[1].online, false);
});

test("чужой ответ провайдеров даёт null", () => {
  assert.equal(parseProviders({ providers: {} }), null);
});
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `npm test`
Expected: FAIL — `Cannot find module '../lib/billing/catalog.ts'`

- [ ] **Step 3: Реализовать минимум**

Создать `lib/billing/catalog.ts`:

```ts
export type PlanFeature = { key: string; label: string };

export type PlanLimit = {
  key: string;
  label: string;
  value: number;
  unlimited: boolean;
};

export type BillingPlan = {
  key: string;
  label: string;
  description: string;
  priceMonthly: number;
  priceYearly: number | null;
  priceMonthlyFrom: number | null;
  currency: string;
  trialDays: number;
  seatsIncluded: number | null;
  extraSeatPriceMonthly: number | null;
  isRequestOnly: boolean;
  features: PlanFeature[];
  limits: PlanLimit[];
};

export type BillingProvider = {
  key: string;
  label: string;
  status: "active" | "manual" | "not_connected";
  online: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseFeatures(value: unknown): PlanFeature[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!isRecord(entry) || !str(entry.key)) {
      return [];
    }
    return [{ key: str(entry.key), label: str(entry.label) }];
  });
}

function parseLimits(value: unknown): PlanLimit[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!isRecord(entry) || !str(entry.key)) {
      return [];
    }
    const amount = num(entry.value);
    return [
      {
        key: str(entry.key),
        label: str(entry.label),
        value: amount ?? 0,
        unlimited: entry.unlimited === true,
      },
    ];
  });
}

function parsePlan(value: unknown): BillingPlan | null {
  if (!isRecord(value)) {
    return null;
  }

  const key = str(value.key);
  const priceMonthly = num(value.priceMonthly);

  // Тариф без ключа или без месячной цены бесполезен: по ключу мы выбираем
  // подписи и кнопку, по цене — что показать. Лучше потерять один, чем
  // отрисовать карточку без имени.
  if (!key || priceMonthly === null) {
    return null;
  }

  return {
    key,
    label: str(value.label, key),
    description: str(value.description),
    priceMonthly,
    priceYearly: num(value.priceYearly),
    priceMonthlyFrom: num(value.priceMonthlyFrom),
    currency: str(value.currency, "UZS"),
    trialDays: num(value.trialDays) ?? 0,
    seatsIncluded: num(value.seatsIncluded),
    extraSeatPriceMonthly: num(value.extraSeatPriceMonthly),
    isRequestOnly: value.isRequestOnly === true,
    features: parseFeatures(value.features),
    limits: parseLimits(value.limits),
  };
}

/**
 * `null` — ответ структурно не наш: страница покажет «цены недоступны».
 * Пустой массив — каталог честно пуст, это другое состояние.
 */
export function parsePlans(input: unknown): BillingPlan[] | null {
  if (!isRecord(input) || !Array.isArray(input.plans)) {
    return null;
  }

  return input.plans.flatMap((entry) => {
    const plan = parsePlan(entry);
    return plan ? [plan] : [];
  });
}

const PROVIDER_STATUSES = new Set(["active", "manual", "not_connected"]);

export function parseProviders(input: unknown): BillingProvider[] | null {
  if (!isRecord(input) || !Array.isArray(input.providers)) {
    return null;
  }

  return input.providers.flatMap((entry) => {
    if (!isRecord(entry) || !str(entry.key)) {
      return [];
    }
    const status = str(entry.status, "not_connected");
    return [
      {
        key: str(entry.key),
        label: str(entry.label, str(entry.key)),
        status: (PROVIDER_STATUSES.has(status)
          ? status
          : "not_connected") as BillingProvider["status"],
        online: entry.online === true,
      },
    ];
  });
}
```

- [ ] **Step 4: Убедиться, что тесты проходят**

Run: `npm test`
Expected: PASS, семь тестов в `catalog.test.ts`.

- [ ] **Step 5: Коммит**

```bash
git add lib/billing/catalog.ts tests/catalog.test.ts
git commit -m "feat: tolerant parsing of the tariff catalog"
```

---

## Task 3: Флаги этапа и загрузка каталога

**Files:**
- Create: `lib/billing/flags.ts`
- Create: `lib/api/base.ts`
- Create: `lib/billing/plans.server.ts`
- Test: `tests/base.test.ts`, `tests/flags.test.ts`

**Interfaces:**
- Consumes: `parsePlans`, `parseProviders` из задачи 2.
- Produces: `PRICES_PUBLISHED: boolean`, `AUTORENEW_AVAILABLE: boolean`, `apiUrl(path: string): string | null`, `loadPlans(): Promise<BillingPlan[] | null>`, `loadProviders(): Promise<BillingProvider[] | null>`.

- [ ] **Step 1: Написать падающие тесты**

Создать `tests/base.test.ts`:

```ts
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
```

Создать `tests/flags.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { AUTORENEW_AVAILABLE, PRICES_PUBLISHED } from "../lib/billing/flags.ts";

// Растяжка, а не проверка логики. Включение кассы обязано быть осознанной
// правкой: она ломает этот тест, и в том же диффе видно, что сверили сумму у
// провайдера (см. «Зависимости», пункт 1 спеки).
test("цены ещё не объявлены", () => {
  assert.equal(PRICES_PUBLISHED, false);
});

test("автопродления на сервере ещё нет", () => {
  assert.equal(AUTORENEW_AVAILABLE, false);
});
```

- [ ] **Step 2: Убедиться, что тесты падают**

Run: `npm test`
Expected: FAIL — `Cannot find module '../lib/api/base.ts'`

- [ ] **Step 3: Реализовать флаги**

Создать `lib/billing/flags.ts`:

```ts
/**
 * Этапы биллинга. Флаги живут в коде, а не в переменных окружения, ровно
 * поэтому: включение цен должно быть видно в диффе и пройти ревью.
 */

/**
 * Цены объявлены, касса открыта.
 *
 * Включать только когда выполнено оба условия:
 *   1. владелец объявил цены;
 *   2. сумма в `billing-plan-catalog.ts` совпадает с суммой, которую спишет
 *      провайдер (`CLICK_PLAN_PRO_AMOUNT_UZS` — см. «Зависимости», пункт 1).
 *
 * Пока false: страница показывает «В процессе обсуждения», платные тарифы
 * ведут на заявку. Списать с человека сумму, которой он не видел, нельзя.
 */
export const PRICES_PUBLISHED = false;

/**
 * Подписка продлевается сама. Включать после серверного автопродления: сейчас
 * оплата разовая, на 30 дней, и текст на странице обещать большего не должен.
 */
export const AUTORENEW_AVAILABLE = false;
```

- [ ] **Step 4: Реализовать адрес API**

Создать `lib/api/base.ts`:

```ts
/**
 * Единственное место, которое знает адрес API приложения. Переменная серверная,
 * без префикса NEXT_PUBLIC_: браузер в API не ходит вообще.
 *
 * `null`, а не исключение: страница тарифов должна честно сказать, что цены
 * недоступны, а не уронить сборку всего сайта.
 */
export function apiUrl(path: string): string | null {
  const base = String(process.env.MYTAMGA_API_URL ?? "").trim();

  if (!base) {
    return null;
  }

  return `${base.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}
```

- [ ] **Step 5: Реализовать загрузку каталога**

Создать `lib/billing/plans.server.ts`:

```ts
import "server-only";

import { apiUrl } from "@/lib/api/base";

import {
  parsePlans,
  parseProviders,
  type BillingPlan,
  type BillingProvider,
} from "./catalog";

// Каталог меняется редко, а страница обязана отдаваться поисковику готовым
// HTML: час свежести — разумный размен.
const REVALIDATE_SECONDS = 3600;

async function loadJson(path: string): Promise<unknown | null> {
  const url = apiUrl(path);

  if (!url) {
    return null;
  }

  try {
    const response = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS },
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as unknown;
  } catch {
    // Сеть, таймаут, нечитаемый JSON — всё это одно состояние для страницы:
    // цен нет. Разбираться в причине здесь нечем и незачем.
    return null;
  }
}

export async function loadPlans(): Promise<BillingPlan[] | null> {
  return parsePlans(await loadJson("/api/billing/plans"));
}

export async function loadProviders(): Promise<BillingProvider[] | null> {
  return parseProviders(await loadJson("/api/billing/payment-providers"));
}
```

- [ ] **Step 6: Убедиться, что тесты проходят**

Run: `npm test && npm run typecheck`
Expected: PASS, шесть новых тестов; typecheck без ошибок.

- [ ] **Step 7: Коммит**

```bash
git add lib/billing/flags.ts lib/api/base.ts lib/billing/plans.server.ts tests/base.test.ts tests/flags.test.ts
git commit -m "feat: catalog loading and the billing stage flags"
```

---

## Task 4: Ошибки API и «повторите через…»

**Files:**
- Create: `lib/api/errors.ts`
- Create: `lib/api/retry.ts`
- Test: `tests/errors.test.ts`

**Interfaces:**
- Consumes: ничего.
- Produces: `class ApiError`, `type BillingErrorCode`, `errorCodeFor(status: number): BillingErrorCode`, `retryAfterSeconds(body: unknown): number | null`.

Второй пункт Review Focus: `retryAfterMs` приходит из API телом `{ error, retryAfterMs }`, заголовка `Retry-After` там нет. Значение может отсутствовать, быть нулём или огромным — «повторите через 10800 секунд» человеку не говорят.

- [ ] **Step 1: Написать падающий тест**

Создать `tests/errors.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { ApiError, errorCodeFor } from "../lib/api/errors.ts";
import { retryAfterSeconds } from "../lib/api/retry.ts";

test("код ответа превращается в код сообщения", () => {
  assert.equal(errorCodeFor(429), "rate");
  assert.equal(errorCodeFor(403), "forbidden");
  assert.equal(errorCodeFor(409), "store");
  assert.equal(errorCodeFor(503), "unavailable");
  assert.equal(errorCodeFor(400), "requestOnly");
  assert.equal(errorCodeFor(404), "noOrganization");
});

test("неизвестный и серверный коды сводятся к сетевой ошибке", () => {
  assert.equal(errorCodeFor(500), "network");
  assert.equal(errorCodeFor(418), "network");
  assert.equal(errorCodeFor(0), "network");
});

test("401 — это не отказ в правах, а истёкшая сессия", () => {
  assert.equal(errorCodeFor(401), "signedOut");
});

test("наши собственные коды из ответа API не выводятся", () => {
  // phoneInvalid, codeInvalid и pricesPending ставим мы сами, до запроса.
  const fromApi = [400, 401, 403, 404, 409, 429, 500, 503].map(errorCodeFor);
  assert.equal(fromApi.includes("phoneInvalid" as never), false);
  assert.equal(fromApi.includes("codeInvalid" as never), false);
  assert.equal(fromApi.includes("pricesPending" as never), false);
});

test("ApiError несёт код и тело ответа", () => {
  const error = new ApiError(409, { message: "store" });
  assert.equal(error.status, 409);
  assert.deepEqual(error.body, { message: "store" });
  assert.ok(error instanceof Error);
});

test("секунды до повтора округляются вверх", () => {
  assert.equal(retryAfterSeconds({ retryAfterMs: 1500 }), 2);
  assert.equal(retryAfterSeconds({ retryAfterMs: 30000 }), 30);
});

test("отсутствующее, нулевое и отрицательное значение дают одну секунду", () => {
  assert.equal(retryAfterSeconds({}), 1);
  assert.equal(retryAfterSeconds({ retryAfterMs: 0 }), 1);
  assert.equal(retryAfterSeconds({ retryAfterMs: -5000 }), 1);
});

test("нечитаемое тело не ломает подсчёт", () => {
  assert.equal(retryAfterSeconds(null), 1);
  assert.equal(retryAfterSeconds("слишком часто"), 1);
  assert.equal(retryAfterSeconds({ retryAfterMs: "минуту" }), 1);
});

test("неправдоподобно большая задержка не называется в секундах", () => {
  // Десять минут — предел, после которого «повторите через N секунд» перестаёт
  // быть полезным: человеку говорят «позже», без числа.
  assert.equal(retryAfterSeconds({ retryAfterMs: 600_000 }), 600);
  assert.equal(retryAfterSeconds({ retryAfterMs: 600_001 }), null);
  assert.equal(retryAfterSeconds({ retryAfterMs: 10_800_000 }), null);
});
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `npm test`
Expected: FAIL — `Cannot find module '../lib/api/errors.ts'`

- [ ] **Step 3: Реализовать ошибки**

Создать `lib/api/errors.ts`:

```ts
/** Код сообщения, а не текст: слова берёт словарь страницы. */
export type BillingErrorCode =
  // Приходят от API.
  | "rate"
  | "forbidden"
  | "store"
  | "unavailable"
  | "requestOnly"
  | "noOrganization"
  | "signedOut"
  | "network"
  // Наши собственные проверки, до обращения к API.
  | "phoneInvalid"
  | "codeInvalid"
  | "pricesPending";

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(`API responded ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/**
 * Русский текст ошибки от сервера на китайскую страницу не попадает: он уходит
 * в лог, а человек видит перевод по коду.
 */
export function errorCodeFor(status: number): BillingErrorCode {
  switch (status) {
    case 429:
      return "rate";
    case 403:
      return "forbidden";
    case 409:
      return "store";
    case 503:
      return "unavailable";
    case 400:
      return "requestOnly";
    case 404:
      return "noOrganization";
    case 401:
      return "signedOut";
    default:
      return "network";
  }
}
```

- [ ] **Step 4: Реализовать подсчёт задержки**

Создать `lib/api/retry.ts`:

```ts
// Дольше десяти минут называть в секундах бессмысленно: «повторите через 10800
// секунд» человек не переведёт в часы, и это выглядит как поломка.
const MAX_NAMEABLE_SECONDS = 600;

/**
 * Секунды до повторной попытки из тела ответа 429 (`{ error, retryAfterMs }`).
 * Заголовка `Retry-After` API не присылает.
 *
 * `null` — задержка есть, но называть её числом не стоит: страница скажет
 * «попробуйте позже».
 */
export function retryAfterSeconds(body: unknown): number | null {
  const raw =
    typeof body === "object" && body !== null
      ? (body as { retryAfterMs?: unknown }).retryAfterMs
      : undefined;

  if (typeof raw !== "number" || !Number.isFinite(raw) || raw <= 0) {
    // Сервер отказал — значит подождать надо, даже если не сказал сколько.
    return 1;
  }

  const seconds = Math.ceil(raw / 1000);

  return seconds > MAX_NAMEABLE_SECONDS ? null : seconds;
}
```

- [ ] **Step 5: Убедиться, что тесты проходят**

Run: `npm test`
Expected: PASS, восемь новых тестов.

- [ ] **Step 6: Коммит**

```bash
git add lib/api/errors.ts lib/api/retry.ts tests/errors.test.ts
git commit -m "feat: map API failures to messages the page can translate"
```

---

## Task 5: Куки сессии

**Files:**
- Create: `lib/api/cookies.ts`
- Test: `tests/cookies.test.ts`

**Interfaces:**
- Consumes: ничего.
- Produces: `COOKIE = { access, refresh, device, transaction }`, `MAX_AGE = { access, refresh, device, transaction }`, `cookieOptions(maxAgeSeconds: number)`, `clearedCookieOptions()`.

- [ ] **Step 1: Написать падающий тест**

Создать `tests/cookies.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { COOKIE, MAX_AGE, clearedCookieOptions, cookieOptions } from "../lib/api/cookies.ts";

test("имена кук не пересекаются и не совпадают с локальной кукой языка", () => {
  const names = Object.values(COOKIE);
  assert.equal(new Set(names).size, names.length);
  assert.ok(!names.includes("NEXT_LOCALE"));
});

test("куки недоступны браузерному скрипту и живут на всём сайте", () => {
  const options = cookieOptions(MAX_AGE.access);
  assert.equal(options.httpOnly, true);
  assert.equal(options.secure, true);
  assert.equal(options.path, "/");
});

test("SameSite именно lax: возврат с оплаты приходит с чужого домена", () => {
  // strict срезал бы сессию ровно в тот момент, когда надо показать результат.
  assert.equal(cookieOptions(MAX_AGE.access).sameSite, "lax");
});

test("срок жизни передаётся как есть", () => {
  assert.equal(cookieOptions(900).maxAge, 900);
  assert.equal(MAX_AGE.access, 900);
});

test("устройство помнится долго, номер платежа — час", () => {
  assert.equal(MAX_AGE.device, 31_536_000);
  assert.equal(MAX_AGE.transaction, 3600);
});

test("удаление куки сохраняет остальные флаги", () => {
  const options = clearedCookieOptions();
  assert.equal(options.maxAge, 0);
  assert.equal(options.httpOnly, true);
  assert.equal(options.path, "/");
});
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `npm test`
Expected: FAIL — `Cannot find module '../lib/api/cookies.ts'`

- [ ] **Step 3: Реализовать**

Создать `lib/api/cookies.ts`:

```ts
/**
 * Токены живут в куках, недоступных браузерному скрипту. На странице работают
 * Spline и шейдеры с внешнего CDN; sessionStorage, который предлагало задание,
 * любой из них прочитал бы.
 */
export const COOKIE = {
  access: "mt_at",
  refresh: "mt_rt",
  device: "mt_did",
  transaction: "mt_tx",
} as const;

export const MAX_AGE = {
  /** Столько живёт access-токен на сервере приложения. */
  access: 900,
  refresh: 60 * 60 * 24 * 30,
  device: 31_536_000,
  /** Номера платежа хватает на страницу возврата и письмо в поддержку. */
  transaction: 3600,
} as const;

type CookieOptions = {
  httpOnly: true;
  secure: true;
  sameSite: "lax";
  path: "/";
  maxAge: number;
};

/**
 * `secure` всегда: браузеры считают localhost защищённым контекстом, так что
 * разработке это не мешает, а забыть снять флаг на продакшене — мешает.
 *
 * `sameSite: "lax"`, а не `strict`: человек возвращается с сайта провайдера,
 * то есть переходом с чужого домена. При `strict` куки не отправились бы, и
 * страница возврата не смогла бы спросить статус оплаты.
 */
export function cookieOptions(maxAgeSeconds: number): CookieOptions {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function clearedCookieOptions(): CookieOptions {
  return cookieOptions(0);
}
```

- [ ] **Step 4: Убедиться, что тесты проходят**

Run: `npm test`
Expected: PASS, шесть новых тестов.

- [ ] **Step 5: Коммит**

```bash
git add lib/api/cookies.ts tests/cookies.test.ts
git commit -m "feat: session cookies out of reach of page scripts"
```

---

## Task 6: Телефон, наш лимит и проверка Origin

**Files:**
- Create: `lib/api/phone.ts`
- Create: `lib/api/throttle.ts`
- Create: `lib/api/origin.ts`
- Test: `tests/phone.test.ts`, `tests/throttle.test.ts`, `tests/origin.test.ts`

**Interfaces:**
- Consumes: ничего.
- Produces: `toUzPhone(input: string): string | null`, `createThrottle(windowMs: number)` с методом `check(key: string, now: number): { allowed: boolean; retryAfterMs: number }`, `isSameOrigin(origin: string | null, host: string | null): boolean`.

Третий пункт Review Focus: человек напишет номер так, как привык — с плюсом, пробелами, дефисами, иногда с восьмёркой впереди. Понятная ошибка на странице лучше, чем 400 от сервера.

- [ ] **Step 1: Написать падающие тесты**

Создать `tests/phone.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { toUzPhone } from "../lib/api/phone.ts";

test("принимает номер, как его пишут люди", () => {
  assert.equal(toUzPhone("+998 90 123-45-67"), "998901234567");
  assert.equal(toUzPhone("998901234567"), "998901234567");
  assert.equal(toUzPhone("(998) 90 1234567"), "998901234567");
});

test("девять цифр дополняются кодом страны", () => {
  assert.equal(toUzPhone("901234567"), "998901234567");
  assert.equal(toUzPhone("90 123 45 67"), "998901234567");
});

test("международная запись через 00 понимается", () => {
  assert.equal(toUzPhone("00998901234567"), "998901234567");
});

test("чужие и неполные номера отвергаются", () => {
  assert.equal(toUzPhone(""), null);
  assert.equal(toUzPhone("90123456"), null);
  assert.equal(toUzPhone("79161234567"), null);
  assert.equal(toUzPhone("8 901 234 56 78"), null);
  assert.equal(toUzPhone("9981234567890"), null);
  assert.equal(toUzPhone("не помню"), null);
});
```

Создать `tests/throttle.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { createThrottle } from "../lib/api/throttle.ts";

test("первый запрос проходит", () => {
  const throttle = createThrottle(30_000);
  assert.deepEqual(throttle.check("998901234567", 1000), {
    allowed: true,
    retryAfterMs: 0,
  });
});

test("повтор в окне отклоняется и говорит, сколько ждать", () => {
  const throttle = createThrottle(30_000);
  throttle.check("998901234567", 1000);
  assert.deepEqual(throttle.check("998901234567", 6000), {
    allowed: false,
    retryAfterMs: 25_000,
  });
});

test("после окна запрос снова проходит", () => {
  const throttle = createThrottle(30_000);
  throttle.check("998901234567", 1000);
  assert.equal(throttle.check("998901234567", 31_000).allowed, true);
});

test("разные номера не мешают друг другу", () => {
  const throttle = createThrottle(30_000);
  throttle.check("998901234567", 1000);
  assert.equal(throttle.check("998907654321", 1000).allowed, true);
});
```

Создать `tests/origin.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { isSameOrigin } from "../lib/api/origin.ts";

test("свой источник принимается", () => {
  assert.equal(isSameOrigin("https://mytamga.uz", "mytamga.uz"), true);
  assert.equal(isSameOrigin("http://localhost:3000", "localhost:3000"), true);
});

test("чужой источник отвергается", () => {
  assert.equal(isSameOrigin("https://evil.example", "mytamga.uz"), false);
  assert.equal(isSameOrigin("https://mytamga.uz.evil.example", "mytamga.uz"), false);
});

test("отсутствующий Origin или Host отвергается", () => {
  // Браузер присылает Origin на всех POST. Нет его — запрос не из браузера.
  assert.equal(isSameOrigin(null, "mytamga.uz"), false);
  assert.equal(isSameOrigin("https://mytamga.uz", null), false);
  assert.equal(isSameOrigin("null", "mytamga.uz"), false);
});
```

- [ ] **Step 2: Убедиться, что тесты падают**

Run: `npm test`
Expected: FAIL — `Cannot find module '../lib/api/phone.ts'`

- [ ] **Step 3: Реализовать телефон**

Создать `lib/api/phone.ts`:

```ts
/**
 * Сервер приложения знает только узбекские номера: `normalizePhone` там
 * оставляет цифры и требует двенадцать, начиная с 998. Поэтому проверяем здесь
 * и говорим человеку понятное, вместо того чтобы получить 400.
 */
export function toUzPhone(input: string): string | null {
  let digits = String(input ?? "").replace(/\D/g, "");

  // Международная запись 00998… — то же самое, что +998….
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  // Девять цифр — номер без кода страны, как его диктуют вслух.
  if (digits.length === 9) {
    digits = `998${digits}`;
  }

  if (digits.length !== 12 || !digits.startsWith("998")) {
    return null;
  }

  return digits;
}
```

- [ ] **Step 4: Реализовать лимит**

Создать `lib/api/throttle.ts`:

```ts
/**
 * Наш лимит поверх серверного: он мягче и нужен от случайных двойных нажатий,
 * чтобы человек не потратил серверную квоту (три запроса в минуту на адрес,
 * пять в час на номер) на собственный дребезг кнопки.
 *
 * Часы передаются снаружи: иначе поведение во времени нечем проверить.
 */
export function createThrottle(windowMs: number) {
  const lastSeen = new Map<string, number>();

  return {
    check(key: string, now: number) {
      const previous = lastSeen.get(key);
      const elapsed = previous === undefined ? Infinity : now - previous;

      if (elapsed < windowMs) {
        return { allowed: false, retryAfterMs: windowMs - elapsed };
      }

      lastSeen.set(key, now);

      // Не даём карте расти бесконечно: всё, что старше окна, уже не нужно.
      for (const [entry, seen] of lastSeen) {
        if (now - seen >= windowMs) {
          lastSeen.delete(entry);
        }
      }

      return { allowed: true, retryAfterMs: 0 };
    },
  };
}
```

- [ ] **Step 5: Реализовать проверку Origin**

Создать `lib/api/origin.ts`:

```ts
/**
 * Защита от запроса с чужой страницы. Вместе с `SameSite=lax` этого хватает:
 * браузер не отправит наши куки в межсайтовом POST, а запрос без `Origin`
 * пришёл не из браузера.
 */
export function isSameOrigin(origin: string | null, host: string | null): boolean {
  if (!origin || !host || origin === "null") {
    return false;
  }

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
```

- [ ] **Step 6: Убедиться, что тесты проходят**

Run: `npm test && npm run typecheck`
Expected: PASS, одиннадцать новых тестов.

- [ ] **Step 7: Коммит**

```bash
git add lib/api/phone.ts lib/api/throttle.ts lib/api/origin.ts tests/phone.test.ts tests/throttle.test.ts tests/origin.test.ts
git commit -m "feat: phone, throttle and origin checks for the session routes"
```

---

## Task 7: Транспорт до API

**Files:**
- Create: `lib/api/forwarded.ts`
- Create: `lib/api/server.ts`
- Test: `tests/forwarded.test.ts`, `tests/server.test.ts`

**Interfaces:**
- Consumes: `apiUrl` из задачи 3, `ApiError` из задачи 4.
- Produces: `clientIpFrom(forwardedFor: string | null, realIp?: string | null): string | null`, тип `ApiCall`, `buildHeaders(call: ApiCall): Record<string, string>`, `callApi<T>(call: ApiCall, fetchImpl?: typeof fetch): Promise<T>`.

Передача настоящего IP клиента — не украшение. Лимит входа в API считается по
`request.ip` с порогом три запроса в минуту на адрес. Если бы в него попадал
адрес нашего сервера, четвёртый человек за минуту получал бы отказ, ничего не
нарушив. Взять из цепочки `X-Forwarded-For` **левое** значение, а не правое:
правое — это ближайший прокси, то есть мы сами.

- [ ] **Step 1: Написать падающие тесты**

Создать `tests/forwarded.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { clientIpFrom } from "../lib/api/forwarded.ts";

test("берёт левый адрес цепочки — клиента, а не прокси", () => {
  assert.equal(clientIpFrom("203.0.113.7, 10.0.0.2, 127.0.0.1"), "203.0.113.7");
});

test("единственный адрес и есть клиент", () => {
  assert.equal(clientIpFrom("203.0.113.7"), "203.0.113.7");
});

test("пробелы и пустые звенья не мешают", () => {
  assert.equal(clientIpFrom("  , 203.0.113.7 , 10.0.0.2"), "203.0.113.7");
});

test("IPv6 в цепочке остаётся целым", () => {
  assert.equal(clientIpFrom("2001:db8::1, 10.0.0.2"), "2001:db8::1");
});

test("без цепочки берётся x-real-ip", () => {
  assert.equal(clientIpFrom(null, "203.0.113.9"), "203.0.113.9");
});

test("без обоих заголовков адреса нет", () => {
  assert.equal(clientIpFrom(null, null), null);
  assert.equal(clientIpFrom("", ""), null);
  assert.equal(clientIpFrom(" , , "), null);
});
```

Создать `tests/server.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { ApiError } from "../lib/api/errors.ts";
import { buildHeaders, callApi } from "../lib/api/server.ts";

test("каждый запрос называет себя веб-клиентом", () => {
  const headers = buildHeaders({ path: "/api/auth/send-code" });
  assert.equal(headers["x-platform"], "web");
});

test("тело запроса объявляется только когда оно есть", () => {
  assert.equal(buildHeaders({ path: "/x" })["content-type"], undefined);
  assert.equal(
    buildHeaders({ path: "/x", method: "POST", body: {} })["content-type"],
    "application/json",
  );
});

test("токен, устройство и адрес клиента доезжают до API", () => {
  const headers = buildHeaders({
    path: "/x",
    accessToken: "token-value",
    deviceId: "device-value",
    clientIp: "203.0.113.7",
    userAgent: "Mozilla/5.0 (Macintosh)",
  });
  assert.equal(headers.authorization, "Bearer token-value");
  assert.equal(headers["x-device-id"], "device-value");
  assert.equal(headers["x-forwarded-for"], "203.0.113.7");
  assert.equal(headers["x-device-name"], "Mozilla/5.0 (Macintosh)");
});

test("отсутствующие значения не превращаются в пустые заголовки", () => {
  const headers = buildHeaders({ path: "/x" });
  assert.equal("authorization" in headers, false);
  assert.equal("x-forwarded-for" in headers, false);
  assert.equal("x-device-id" in headers, false);
});

test("имя устройства обрезается: сервер хранит его как название сессии", () => {
  const headers = buildHeaders({ path: "/x", userAgent: "a".repeat(400) });
  assert.equal(headers["x-device-name"].length, 120);
});

test("успешный ответ разбирается как JSON", async () => {
  process.env.MYTAMGA_API_URL = "https://api.test";
  const result = await callApi<{ ok: boolean }>(
    { path: "/api/billing/plans" },
    async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
  );
  assert.deepEqual(result, { ok: true });
});

test("пустой ответ не считается поломкой", async () => {
  process.env.MYTAMGA_API_URL = "https://api.test";
  const result = await callApi({ path: "/x", method: "POST" }, async () =>
    new Response(null, { status: 204 }),
  );
  assert.equal(result, null);
});

test("код ошибки и тело доходят до вызывающего", async () => {
  process.env.MYTAMGA_API_URL = "https://api.test";
  await assert.rejects(
    () =>
      callApi(
        { path: "/x" },
        async () =>
          new Response(JSON.stringify({ retryAfterMs: 5000 }), { status: 429 }),
      ),
    (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 429);
      assert.deepEqual(error.body, { retryAfterMs: 5000 });
      return true;
    },
  );
});

test("без адреса API запрос не уходит, а честно отказывает", async () => {
  delete process.env.MYTAMGA_API_URL;
  await assert.rejects(
    () => callApi({ path: "/x" }, async () => new Response("{}", { status: 200 })),
    (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 503);
      return true;
    },
  );
});
```

- [ ] **Step 2: Убедиться, что тесты падают**

Run: `npm test`
Expected: FAIL — `Cannot find module '../lib/api/forwarded.ts'`

- [ ] **Step 3: Реализовать чтение адреса клиента**

Создать `lib/api/forwarded.ts`:

```ts
/**
 * Адрес клиента из цепочки прокси. Берём **левое** звено: правое — ближайший
 * прокси, то есть мы сами. Ошибка здесь незаметна и дорога: серверный лимит
 * входа начал бы считать всех посетителей как одного.
 */
export function clientIpFrom(
  forwardedFor: string | null,
  realIp?: string | null,
): string | null {
  const chain = String(forwardedFor ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (chain.length > 0) {
    return chain[0];
  }

  const direct = String(realIp ?? "").trim();

  return direct || null;
}
```

- [ ] **Step 4: Реализовать транспорт**

Создать `lib/api/server.ts`:

```ts
import { apiUrl } from "./base";
import { ApiError } from "./errors";

export type ApiCall = {
  path: string;
  method?: "GET" | "POST";
  body?: unknown;
  accessToken?: string;
  deviceId?: string;
  clientIp?: string | null;
  userAgent?: string | null;
};

// Сервер хранит это как название сессии устройства, которое человек потом видит
// в списке своих входов. Целый User-Agent там не нужен.
const MAX_DEVICE_NAME = 120;

export function buildHeaders(call: ApiCall): Record<string, string> {
  const headers: Record<string, string> = {
    accept: "application/json",
    "x-platform": "web",
  };

  if (call.body !== undefined) {
    headers["content-type"] = "application/json";
  }

  if (call.accessToken) {
    headers.authorization = `Bearer ${call.accessToken}`;
  }

  if (call.deviceId) {
    headers["x-device-id"] = call.deviceId;
  }

  if (call.clientIp) {
    headers["x-forwarded-for"] = call.clientIp;
  }

  const deviceName = String(call.userAgent ?? "").trim();

  if (deviceName) {
    headers["x-device-name"] = deviceName.slice(0, MAX_DEVICE_NAME);
  }

  return headers;
}

/**
 * Единственное место, которое обращается к API приложения. `fetchImpl`
 * подставляется в тестах — сетевой вызов иначе нечем проверить.
 */
export async function callApi<T>(
  call: ApiCall,
  fetchImpl: typeof fetch = fetch,
): Promise<T> {
  const url = apiUrl(call.path);

  if (!url) {
    // Настройки нет — для страницы это то же, что недоступный провайдер.
    throw new ApiError(503, { error: "MYTAMGA_API_URL is not configured" });
  }

  let response: Response;

  try {
    response = await fetchImpl(url, {
      method: call.method ?? "GET",
      headers: buildHeaders(call),
      body: call.body === undefined ? undefined : JSON.stringify(call.body),
      cache: "no-store",
    });
  } catch (cause) {
    throw new ApiError(0, { error: String(cause) });
  }

  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      // Ответ не JSON — обычно это страница ошибки от прокси.
      payload = { error: text.slice(0, 500) };
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, payload);
  }

  return payload as T;
}
```

- [ ] **Step 5: Убедиться, что тесты проходят**

Run: `npm test && npm run typecheck`
Expected: PASS, пятнадцать новых тестов.

- [ ] **Step 6: Коммит**

```bash
git add lib/api/forwarded.ts lib/api/server.ts tests/forwarded.test.ts tests/server.test.ts
git commit -m "feat: API transport that forwards the real client address"
```

---

## Task 8: Сессия и ручки входа

**Files:**
- Create: `lib/api/session.ts`
- Create: `app/api/session/request-code/route.ts`
- Create: `app/api/session/verify-code/route.ts`
- Create: `app/api/session/refresh/route.ts`
- Create: `app/api/session/logout/route.ts`

**Interfaces:**
- Consumes: `COOKIE`, `MAX_AGE`, `cookieOptions`, `clearedCookieOptions` (задача 5); `toUzPhone`, `createThrottle`, `isSameOrigin` (задача 6); `clientIpFrom`, `callApi` (задача 7); `ApiError`, `errorCodeFor` (задача 4); `retryAfterSeconds` (задача 4).
- Produces: `readContext(request)`, `attachSession(response, tokens)`, `clearSession(response)`, `callWithSession<T>(request, call)`, `failure(code, extra?)`, тип `SessionTokens`.

Ответ наших ручек всегда одной формы: `{ ok: true, data? }` либо
`{ ok: false, code, retryAfter? }`. Клиент переводит `code` словарём — русский
текст сервера на китайскую страницу не попадает.

- [ ] **Step 1: Реализовать обвязку сессии**

Создать `lib/api/session.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";

import { COOKIE, MAX_AGE, clearedCookieOptions, cookieOptions } from "./cookies";
import { ApiError, errorCodeFor, type BillingErrorCode } from "./errors";
import { clientIpFrom } from "./forwarded";
import { retryAfterSeconds } from "./retry";
import { callApi, type ApiCall } from "./server";

export type SessionTokens = { accessToken: string; refreshToken: string };

export type RequestContext = {
  accessToken?: string;
  refreshToken?: string;
  deviceId: string;
  isNewDevice: boolean;
  clientIp: string | null;
  userAgent: string | null;
};

/** Всё, что нужно знать о запросе, одним чтением. */
export function readContext(request: NextRequest): RequestContext {
  const existingDevice = request.cookies.get(COOKIE.device)?.value;

  return {
    accessToken: request.cookies.get(COOKIE.access)?.value,
    refreshToken: request.cookies.get(COOKIE.refresh)?.value,
    // Идентификатор устройства выпускает сервер: localStorage для этого не
    // нужен, а без заголовка каждый вход считался бы новым устройством.
    deviceId: existingDevice || crypto.randomUUID(),
    isNewDevice: !existingDevice,
    clientIp: clientIpFrom(
      request.headers.get("x-forwarded-for"),
      request.headers.get("x-real-ip"),
    ),
    userAgent: request.headers.get("user-agent"),
  };
}

export function attachDevice(
  response: NextResponse,
  context: RequestContext,
): NextResponse {
  if (context.isNewDevice) {
    response.cookies.set(COOKIE.device, context.deviceId, cookieOptions(MAX_AGE.device));
  }
  return response;
}

export function attachSession(
  response: NextResponse,
  tokens: SessionTokens,
): NextResponse {
  response.cookies.set(COOKIE.access, tokens.accessToken, cookieOptions(MAX_AGE.access));
  response.cookies.set(COOKIE.refresh, tokens.refreshToken, cookieOptions(MAX_AGE.refresh));
  return response;
}

export function clearSession(response: NextResponse): NextResponse {
  response.cookies.set(COOKIE.access, "", clearedCookieOptions());
  response.cookies.set(COOKIE.refresh, "", clearedCookieOptions());
  return response;
}

export function failure(code: BillingErrorCode, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, code, ...extra }, { status: 200 });
}

/**
 * Ошибка API в ответ, который страница сможет перевести. Статус наших ручек
 * всегда 200: код ошибки лежит в теле, и клиенту не нужно разбирать два
 * разных языка отказов.
 */
export function failureFrom(error: unknown) {
  if (!(error instanceof ApiError)) {
    return failure("network");
  }

  const code = errorCodeFor(error.status);

  if (code === "rate") {
    return failure(code, { retryAfter: retryAfterSeconds(error.body) });
  }

  return failure(code);
}

/**
 * Запрос от имени человека. Access-токен живёт пятнадцать минут, поэтому на 401
 * обновляемся по refresh-токену и повторяем один раз. Обновлённые токены
 * возвращаются наружу, чтобы ручка положила их в куки — переписать их может
 * только она, у неё есть ответ.
 */
export async function callWithSession<T>(
  context: RequestContext,
  call: Omit<ApiCall, "accessToken" | "deviceId" | "clientIp" | "userAgent">,
): Promise<{ data: T; tokens?: SessionTokens }> {
  const base = {
    ...call,
    deviceId: context.deviceId,
    clientIp: context.clientIp,
    userAgent: context.userAgent,
  };

  if (!context.accessToken && !context.refreshToken) {
    throw new ApiError(401, { error: "no session" });
  }

  if (context.accessToken) {
    try {
      return { data: await callApi<T>({ ...base, accessToken: context.accessToken }) };
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401 || !context.refreshToken) {
        throw error;
      }
    }
  }

  if (!context.refreshToken) {
    throw new ApiError(401, { error: "no refresh token" });
  }

  const refreshed = await callApi<SessionTokens>({
    ...base,
    path: "/api/auth/refresh",
    method: "POST",
    body: { refreshToken: context.refreshToken },
  });

  if (!refreshed?.accessToken) {
    throw new ApiError(401, { error: "refresh failed" });
  }

  const data = await callApi<T>({ ...base, accessToken: refreshed.accessToken });

  return { data, tokens: refreshed };
}
```

- [ ] **Step 2: Реализовать запрос кода**

Создать `app/api/session/request-code/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";

import { isSameOrigin } from "@/lib/api/origin";
import { toUzPhone } from "@/lib/api/phone";
import { callApi } from "@/lib/api/server";
import { attachDevice, failure, failureFrom, readContext } from "@/lib/api/session";
import { createThrottle } from "@/lib/api/throttle";

// Наш лимит — от двойного нажатия, не вместо серверного. Живёт в памяти
// процесса: на одной машине с API этого достаточно, а переживать перезапуск
// такому счётчику незачем.
const throttle = createThrottle(30_000);

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request.headers.get("origin"), request.headers.get("host"))) {
    return failure("network");
  }

  const body = (await request.json().catch(() => null)) as { phone?: unknown } | null;
  const phone = toUzPhone(String(body?.phone ?? ""));

  if (!phone) {
    return failure("phoneInvalid");
  }

  const context = readContext(request);
  const gate = throttle.check(phone, Date.now());

  if (!gate.allowed) {
    return failure("rate", { retryAfter: Math.ceil(gate.retryAfterMs / 1000) });
  }

  try {
    await callApi({
      path: "/api/auth/send-code",
      method: "POST",
      body: { phone },
      deviceId: context.deviceId,
      clientIp: context.clientIp,
      userAgent: context.userAgent,
    });
  } catch (error) {
    return attachDevice(failureFrom(error), context);
  }

  return attachDevice(NextResponse.json({ ok: true }), context);
}
```

- [ ] **Step 3: Реализовать проверку кода**

Создать `app/api/session/verify-code/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";

import { isSameOrigin } from "@/lib/api/origin";
import { toUzPhone } from "@/lib/api/phone";
import { callApi } from "@/lib/api/server";
import {
  attachDevice,
  attachSession,
  failure,
  failureFrom,
  readContext,
  type SessionTokens,
} from "@/lib/api/session";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request.headers.get("origin"), request.headers.get("host"))) {
    return failure("network");
  }

  const body = (await request.json().catch(() => null)) as
    | { phone?: unknown; code?: unknown }
    | null;

  const phone = toUzPhone(String(body?.phone ?? ""));
  const code = String(body?.code ?? "").replace(/\D/g, "");

  if (!phone) {
    return failure("phoneInvalid");
  }

  if (code.length < 4) {
    return failure("codeInvalid");
  }

  const context = readContext(request);

  try {
    const tokens = await callApi<SessionTokens>({
      path: "/api/auth/verify-code",
      method: "POST",
      body: { phone, code },
      deviceId: context.deviceId,
      clientIp: context.clientIp,
      userAgent: context.userAgent,
    });

    if (!tokens?.accessToken || !tokens?.refreshToken) {
      return attachDevice(failure("network"), context);
    }

    // Наружу уходит только признак успеха: ни один токен браузеру не виден.
    return attachDevice(
      attachSession(NextResponse.json({ ok: true }), tokens),
      context,
    );
  } catch (error) {
    return attachDevice(failureFrom(error), context);
  }
}
```

- [ ] **Step 4: Реализовать обновление и выход**

Создать `app/api/session/refresh/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";

import { isSameOrigin } from "@/lib/api/origin";
import { callApi } from "@/lib/api/server";
import {
  attachSession,
  clearSession,
  failure,
  failureFrom,
  readContext,
  type SessionTokens,
} from "@/lib/api/session";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request.headers.get("origin"), request.headers.get("host"))) {
    return failure("network");
  }

  const context = readContext(request);

  if (!context.refreshToken) {
    return clearSession(failure("signedOut"));
  }

  try {
    const tokens = await callApi<SessionTokens>({
      path: "/api/auth/refresh",
      method: "POST",
      body: { refreshToken: context.refreshToken },
      deviceId: context.deviceId,
      clientIp: context.clientIp,
      userAgent: context.userAgent,
    });

    if (!tokens?.accessToken) {
      return clearSession(failure("signedOut"));
    }

    return attachSession(NextResponse.json({ ok: true }), tokens);
  } catch (error) {
    // Refresh-токен мёртв — держать его в куке незачем.
    return clearSession(failureFrom(error));
  }
}
```

Создать `app/api/session/logout/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";

import { isSameOrigin } from "@/lib/api/origin";
import { callApi } from "@/lib/api/server";
import { clearSession, failure, readContext } from "@/lib/api/session";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request.headers.get("origin"), request.headers.get("host"))) {
    return failure("network");
  }

  const context = readContext(request);

  if (context.accessToken) {
    // Сессия на сервере закрывается по возможности, но куки снимаем в любом
    // случае: выход не должен зависеть от доступности API.
    await callApi({
      path: "/api/auth/logout",
      method: "POST",
      body: { refreshToken: context.refreshToken },
      accessToken: context.accessToken,
      deviceId: context.deviceId,
      clientIp: context.clientIp,
      userAgent: context.userAgent,
    }).catch(() => null);
  }

  return clearSession(NextResponse.json({ ok: true }));
}
```

- [ ] **Step 5: Проверить сборку и типы**

Run: `npm test && npm run typecheck && npm run lint`
Expected: тесты проходят, типы чистые, линт без замечаний.

- [ ] **Step 6: Коммит**

```bash
git add lib/api/session.ts app/api/session
git commit -m "feat: phone sign-in through our own routes"
```

---

## Task 9: Ручки кассы

**Files:**
- Create: `lib/billing/subscription.ts`
- Create: `app/api/subscription/route.ts`
- Create: `app/api/checkout/route.ts`
- Create: `app/api/upgrade-request/route.ts`
- Test: `tests/subscription.test.ts`

**Interfaces:**
- Consumes: `callWithSession`, `attachSession`, `failure`, `failureFrom`, `readContext` (задача 8); `loadProviders` (задача 3); `PRICES_PUBLISHED` (задача 3); `COOKIE`, `MAX_AGE`, `cookieOptions` (задача 5).
- Produces: тип `SubscriptionView`, `parseSubscription(input: unknown): SubscriptionView | null`.

Наружу отдаём не весь ответ API, а узкий вид: браузеру не нужны внутренности
организации, а нам не нужно, чтобы страница зависела от полей, которые могут
поменяться. Метка источника (`stripeStatus`) переводится в понятное `source`.

- [ ] **Step 1: Написать падающий тест**

Создать `tests/subscription.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { parseSubscription } from "../lib/billing/subscription.ts";

const summary = {
  ok: true,
  plan: { key: "pro", label: "Pro", description: "…" },
  status: "active",
  stripeStatus: "click_paid",
  nextBillingAt: "2026-10-26T00:00:00.000Z",
  billingPermissions: { canManageSubscription: true },
  seatsPurchased: 1,
  seatsUsed: 1,
  organization: { id: "org-1", name: "ООО Ромашка", secret: "не наше дело" },
};

test("сводит ответ API к узкому виду", () => {
  const view = parseSubscription(summary);
  assert.equal(view?.planKey, "pro");
  assert.equal(view?.status, "active");
  assert.equal(view?.canManageSubscription, true);
  assert.equal(view?.nextBillingAt, "2026-10-26T00:00:00.000Z");
  assert.equal(view?.organizationName, "ООО Ромашка");
});

test("внутренности организации наружу не уходят", () => {
  const view = parseSubscription(summary);
  assert.equal("organization" in (view as object), false);
  assert.equal(JSON.stringify(view).includes("не наше дело"), false);
});

test("источник оплаты называется понятным словом", () => {
  assert.equal(parseSubscription(summary)?.source, "site");
  assert.equal(parseSubscription({ ...summary, stripeStatus: "app_store" })?.source, "appStore");
  assert.equal(parseSubscription({ ...summary, stripeStatus: "play_store" })?.source, "playStore");
  assert.equal(parseSubscription({ ...summary, stripeStatus: "trialing" })?.source, "other");
  assert.equal(parseSubscription({ ...summary, stripeStatus: null })?.source, "other");
});

test("подписка из магазина видна отдельным признаком", () => {
  assert.equal(parseSubscription(summary)?.isStoreManaged, false);
  assert.equal(
    parseSubscription({ ...summary, stripeStatus: "app_store" })?.isStoreManaged,
    true,
  );
});

test("отсутствие прав на оплату — не то же, что их наличие", () => {
  const view = parseSubscription({ ...summary, billingPermissions: {} });
  assert.equal(view?.canManageSubscription, false);
});

test("чужой ответ даёт null", () => {
  assert.equal(parseSubscription(null), null);
  assert.equal(parseSubscription({ plan: "pro" }), null);
  assert.equal(parseSubscription({ status: "active" }), null);
});

test("неизвестный статус сводится к истёкшему, а не к активному", () => {
  // Ошибаться надо в сторону «доступа нет»: обратное открывает платное даром.
  assert.equal(parseSubscription({ ...summary, status: "что-то новое" })?.status, "expired");
});
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `npm test`
Expected: FAIL — `Cannot find module '../lib/billing/subscription.ts'`

- [ ] **Step 3: Реализовать узкий вид подписки**

Создать `lib/billing/subscription.ts`:

```ts
export type SubscriptionSource = "site" | "appStore" | "playStore" | "other";

export type SubscriptionView = {
  planKey: string;
  planLabel: string;
  status: "active" | "trial" | "expired";
  source: SubscriptionSource;
  isStoreManaged: boolean;
  nextBillingAt: string | null;
  canManageSubscription: boolean;
  organizationName: string | null;
  seatsPurchased: number | null;
  seatsUsed: number | null;
};

// Метки источника, которыми сервер помечает подписку.
const SOURCES: Record<string, SubscriptionSource> = {
  click_paid: "site",
  app_store: "appStore",
  play_store: "playStore",
};

const STATUSES = new Set(["active", "trial", "expired"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseSubscription(input: unknown): SubscriptionView | null {
  if (!isRecord(input) || !isRecord(input.plan)) {
    return null;
  }

  const planKey = typeof input.plan.key === "string" ? input.plan.key : "";

  if (!planKey) {
    return null;
  }

  const rawStatus = typeof input.status === "string" ? input.status : "";
  const marker = typeof input.stripeStatus === "string" ? input.stripeStatus : "";
  const source = SOURCES[marker] ?? "other";
  const permissions = isRecord(input.billingPermissions) ? input.billingPermissions : {};
  const organization = isRecord(input.organization) ? input.organization : {};

  return {
    planKey,
    planLabel: typeof input.plan.label === "string" ? input.plan.label : planKey,
    // Неизвестный статус — «истёк»: ошибаться надо в сторону закрытого доступа.
    status: (STATUSES.has(rawStatus) ? rawStatus : "expired") as SubscriptionView["status"],
    source,
    isStoreManaged: source === "appStore" || source === "playStore",
    nextBillingAt:
      typeof input.nextBillingAt === "string" && input.nextBillingAt
        ? input.nextBillingAt
        : null,
    canManageSubscription: permissions.canManageSubscription === true,
    organizationName: typeof organization.name === "string" ? organization.name : null,
    seatsPurchased: typeof input.seatsPurchased === "number" ? input.seatsPurchased : null,
    seatsUsed: typeof input.seatsUsed === "number" ? input.seatsUsed : null,
  };
}
```

- [ ] **Step 4: Реализовать ручку подписки**

Создать `app/api/subscription/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";

import { attachSession, callWithSession, failure, failureFrom, readContext } from "@/lib/api/session";
import { parseSubscription } from "@/lib/billing/subscription";

export async function GET(request: NextRequest) {
  const context = readContext(request);

  try {
    const { data, tokens } = await callWithSession<unknown>(context, {
      path: "/api/organizations/current/subscription",
    });

    const view = parseSubscription(data);

    if (!view) {
      return failure("network");
    }

    const response = NextResponse.json({ ok: true, subscription: view });

    // Токен мог обновиться по пути — положить его обратно может только ручка.
    return tokens ? attachSession(response, tokens) : response;
  } catch (error) {
    return failureFrom(error);
  }
}
```

- [ ] **Step 5: Реализовать ручку оплаты**

Создать `app/api/checkout/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";

import { COOKIE, MAX_AGE, cookieOptions } from "@/lib/api/cookies";
import { isSameOrigin } from "@/lib/api/origin";
import { attachSession, callWithSession, failure, failureFrom, readContext } from "@/lib/api/session";
import { PRICES_PUBLISHED } from "@/lib/billing/flags";
import { loadProviders } from "@/lib/billing/plans.server";

type CheckoutResult = { url?: unknown; transactionId?: unknown };

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request.headers.get("origin"), request.headers.get("host"))) {
    return failure("network");
  }

  // Второй рубеж. Пока цена не объявлена, списывать нечего: провайдер возьмёт
  // сумму из своей настройки, а человек её не видел.
  if (!PRICES_PUBLISHED) {
    return failure("pricesPending");
  }

  const body = (await request.json().catch(() => null)) as
    | { planKey?: unknown; provider?: unknown }
    | null;

  const planKey = String(body?.planKey ?? "");
  const provider = String(body?.provider ?? "");

  if (!planKey) {
    return failure("requestOnly");
  }

  // Оплату предлагаем только через то, что реестр объявил подключённым:
  // показывать иллюзию онлайн-оплаты он запрещает прямо.
  const providers = await loadProviders();
  const isOnline = providers?.some((entry) => entry.key === provider && entry.online);

  if (!isOnline) {
    return failure("unavailable");
  }

  const context = readContext(request);

  try {
    const { data, tokens } = await callWithSession<CheckoutResult>(context, {
      path: "/api/organizations/current/subscription/checkout-session",
      method: "POST",
      body: { planKey, provider, source: "website" },
    });

    const url = typeof data?.url === "string" ? data.url : "";
    const transactionId = typeof data?.transactionId === "string" ? data.transactionId : "";

    if (!url) {
      return failure("network");
    }

    const response = NextResponse.json({ ok: true, url });

    if (transactionId) {
      // Провайдер вернёт человека без наших параметров, а номер платежа нужен
      // странице возврата и письму в поддержку.
      response.cookies.set(COOKIE.transaction, transactionId, cookieOptions(MAX_AGE.transaction));
    }

    return tokens ? attachSession(response, tokens) : response;
  } catch (error) {
    return failureFrom(error);
  }
}
```

- [ ] **Step 6: Реализовать ручку заявки**

Создать `app/api/upgrade-request/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";

import { isSameOrigin } from "@/lib/api/origin";
import { attachSession, callWithSession, failure, failureFrom, readContext } from "@/lib/api/session";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request.headers.get("origin"), request.headers.get("host"))) {
    return failure("network");
  }

  const body = (await request.json().catch(() => null)) as
    | { planKey?: unknown; note?: unknown }
    | null;

  const planKey = String(body?.planKey ?? "");

  if (!planKey) {
    return failure("requestOnly");
  }

  const context = readContext(request);

  try {
    const { tokens } = await callWithSession<unknown>(context, {
      path: "/api/organizations/current/subscription/upgrade-requests",
      method: "POST",
      // Поле называется requestedPlanKey, а не planKey: перепутать — значит
      // молча создавать пустые заявки.
      body: {
        requestedPlanKey: planKey,
        note: String(body?.note ?? "").slice(0, 2000) || undefined,
      },
    });

    const response = NextResponse.json({ ok: true });

    return tokens ? attachSession(response, tokens) : response;
  } catch (error) {
    return failureFrom(error);
  }
}
```

- [ ] **Step 7: Проверить**

Run: `npm test && npm run typecheck && npm run lint`
Expected: PASS, семь новых тестов.

- [ ] **Step 8: Коммит**

```bash
git add lib/billing/subscription.ts app/api/subscription app/api/checkout app/api/upgrade-request tests/subscription.test.ts
git commit -m "feat: subscription, checkout and upgrade-request routes"
```

---

## Task 10: Подписи возможностей по ключам

**Files:**
- Create: `lib/billing/labels.ts`
- Test: `tests/labels.test.ts`

**Interfaces:**
- Consumes: ничего (словари содержимого приходят в задаче 11).
- Produces: тип `LabelMap = Record<string, string>`, `labelFor(map: LabelMap | undefined, key: string, apiLabel: string): string`.

Четвёртый пункт Review Focus. Каталог отдаёт подписи только по-русски, поэтому
русская страница берёт их прямо из API, а остальные три — из своих карт по
ключу. Ключ, которого в карте нет, показывается русской подписью из API: дыра
в карточке хуже иностранного слова.

- [ ] **Step 1: Написать падающий тест**

Создать `tests/labels.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { labelFor } from "../lib/billing/labels.ts";

const uz: Record<string, string> = { ai_check: "AI tekshiruvi" };

test("известный ключ берётся из карты языка", () => {
  assert.equal(labelFor(uz, "ai_check", "AI-проверка"), "AI tekshiruvi");
});

test("незнакомый ключ показывается русской подписью из API", () => {
  assert.equal(labelFor(uz, "brand_new_feature", "Совсем новое"), "Совсем новое");
});

test("русская страница карты не имеет и всегда берёт API", () => {
  assert.equal(labelFor(undefined, "ai_check", "AI-проверка"), "AI-проверка");
});

test("пустая подпись в карте не прячет содержимое", () => {
  assert.equal(labelFor({ ai_check: "  " }, "ai_check", "AI-проверка"), "AI-проверка");
});

test("если и API молчит, показывается ключ, а не пустота", () => {
  // Пустая строчка в списке возможностей читается как сбой вёрстки.
  assert.equal(labelFor(undefined, "ai_check", ""), "ai_check");
});
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `npm test`
Expected: FAIL — `Cannot find module '../lib/billing/labels.ts'`

- [ ] **Step 3: Реализовать**

Создать `lib/billing/labels.ts`:

```ts
export type LabelMap = Record<string, string>;

/**
 * Подпись возможности или лимита. Каталог знает только русский, поэтому
 * русская страница обходится без карты, а остальные языки переводят по
 * стабильному ключу (`ai_check`, `team_seats`).
 *
 * Порядок отката именно такой: карта языка, затем русская подпись из API,
 * затем сам ключ. Пустая строка в списке возможностей выглядит как поломка.
 */
export function labelFor(
  map: LabelMap | undefined,
  key: string,
  apiLabel: string,
): string {
  const translated = map?.[key]?.trim();

  if (translated) {
    return translated;
  }

  return apiLabel.trim() || key;
}
```

- [ ] **Step 4: Убедиться, что тесты проходят**

Run: `npm test`
Expected: PASS, пять новых тестов.

- [ ] **Step 5: Коммит**

```bash
git add lib/billing/labels.ts tests/labels.test.ts
git commit -m "feat: translate catalog labels by their stable keys"
```

---

## Task 11: Содержимое словарей — тарифы и касса

**Files:**
- Modify: `lib/i18n/dictionaries/ru.ts` (раздел `billing`)
- Modify: `lib/i18n/dictionaries/uz.ts`, `lib/i18n/dictionaries/en.ts`, `lib/i18n/dictionaries/zh.ts`
- Create: `lib/billing/label-maps.ts`
- Test: `tests/label-maps.test.ts`

**Interfaces:**
- Consumes: `LabelMap` из задачи 10.
- Produces: `FEATURE_LABELS: Partial<Record<Locale, LabelMap>>`, `LIMIT_LABELS: Partial<Record<Locale, LabelMap>>`; `Dictionary["billing"]`.

`ru` — источник типа, поэтому раздел добавляется сначала туда, и `npm run
typecheck` сам потребует те же ключи в трёх остальных. Карты подписей русского
не содержат: русская страница берёт подписи прямо из каталога.

- [ ] **Step 1: Добавить раздел `billing` в русский словарь**

В `lib/i18n/dictionaries/ru.ts`, перед `footer`, вставить:

```ts
  billing: {
    nav: "Тарифы",
    metaTitle: "Тарифы MyTamga — подписка для импортёров и брокеров",
    metaDescription:
      "Тарифы MyTamga: что входит в каждый, сколько мест в команде и как оформить подписку для приложения.",
    kicker: "Тарифы",
    title: "Подписка MyTamga",
    lead: "Один доступ для приложения и сайта. Тариф, оформленный здесь, открывается на всех устройствах.",
    // Цены ещё не объявлены: пока это единственное честное, что можно сказать.
    pricePending: "В процессе обсуждения",
    perMonth: "{amount} сум/мес",
    perYear: "{amount} сум/год",
    free: "Бесплатно",
    freeForever: "Бесплатно постоянно — это не пробный период",
    byRequest: "По заявке",
    fromMonthly: "от {amount} сум/мес",
    period: {
      label: "Период оплаты",
      monthly: "Месяц",
      yearly: "Год",
    },
    yearlyAs: "Год стоит как {months} месяцев",
    seatsIncluded: "{count} мест в команде",
    extraSeat: "{amount} сум за место сверх",
    unlimited: "Без ограничений",
    catalogUnavailable:
      "Цены временно недоступны. Напишите нам — пришлём действующие условия.",
    renewManual: "Разовая оплата на 30 дней. Продлевать вручную.",
    renewAuto: "Продлевается автоматически, отменить можно в любой момент.",
    cta: {
      included: "Уже включён",
      buy: "Оформить",
      request: "Запросить",
      download: "Скачать приложение",
    },
    providers: {
      label: "Способ оплаты",
      connecting: "Подключается",
    },
    checkout: {
      title: "Оформление",
      phoneLabel: "Номер телефона",
      phoneHint: "Узбекский номер, например +998 90 123 45 67",
      sendCode: "Получить код",
      codeLabel: "Код из SMS",
      codeHint: "Шесть цифр из сообщения",
      confirm: "Подтвердить",
      changeNumber: "Изменить номер",
      signedIn: "Вход выполнен",
      signOut: "Выйти",
      currentPlan: "Текущий тариф",
      until: "Действует до {date}",
      pay: "Перейти к оплате",
      requestSent: "Заявка отправлена — мы свяжемся с вами.",
      ownerOnly: "Оплату оформляет владелец организации.",
      storeManaged:
        "Подписка оформлена в магазине приложений. Управлять ею можно там же.",
      // Сервер приложения знает только узбекские номера — это его устройство,
      // а не наш выбор.
      uzPhoneOnly:
        "Оплата на сайте доступна с узбекским номером. Оставьте заявку — предложим другой способ.",
      pricesPending: "Цены ещё обсуждаются. Оставьте заявку — сообщим, когда откроем оплату.",
    },
    errors: {
      rate: "Слишком часто. Повторите через {seconds} с.",
      rateLater: "Слишком часто. Попробуйте позже.",
      forbidden: "Оплату оформляет владелец организации.",
      store: "Подписка оформлена в магазине приложений. Управлять ею можно там же.",
      unavailable: "Онлайн-оплата подключается. Напишите нам — оформим доступ.",
      requestOnly: "Этот тариф оформляется по заявке.",
      noOrganization: "Организация не найдена. Войдите заново.",
      signedOut: "Сессия истекла. Войдите заново.",
      network: "Не удалось связаться с сервером. Попробуйте ещё раз.",
      phoneInvalid: "Проверьте номер: нужен узбекский, например +998 90 123 45 67.",
      codeInvalid: "Код из SMS — шесть цифр.",
      pricesPending: "Оплата пока не открыта.",
    },
  },
```

- [ ] **Step 2: Убедиться, что типы падают на трёх словарях**

Run: `npm run typecheck`
Expected: FAIL — TS2741 на `uz`, `en`, `zh`: `Property 'billing' is missing`.

- [ ] **Step 3: Перевести раздел на узбекский**

В `lib/i18n/dictionaries/uz.ts`, на то же место:

```ts
  billing: {
    nav: "Tariflar",
    metaTitle: "MyTamga tariflari — importchilar va brokerlar uchun obuna",
    metaDescription:
      "MyTamga tariflari: har biriga nima kiradi, jamoada qancha o‘rin bor va ilova uchun obunani qanday rasmiylashtirish mumkin.",
    kicker: "Tariflar",
    title: "MyTamga obunasi",
    lead: "Ilova va sayt uchun bitta ruxsat. Bu yerda rasmiylashtirilgan tarif barcha qurilmalarda ishlaydi.",
    pricePending: "Muhokama qilinmoqda",
    perMonth: "{amount} so‘m/oy",
    perYear: "{amount} so‘m/yil",
    free: "Bepul",
    freeForever: "Doimo bepul — bu sinov davri emas",
    byRequest: "So‘rov bo‘yicha",
    fromMonthly: "{amount} so‘m/oydan",
    period: {
      label: "To‘lov davri",
      monthly: "Oy",
      yearly: "Yil",
    },
    yearlyAs: "Yil {months} oy narxida",
    seatsIncluded: "Jamoada {count} o‘rin",
    extraSeat: "Qo‘shimcha o‘rin uchun {amount} so‘m",
    unlimited: "Cheklovsiz",
    catalogUnavailable:
      "Narxlar vaqtincha mavjud emas. Bizga yozing — amaldagi shartlarni yuboramiz.",
    renewManual: "30 kunga bir martalik to‘lov. Qo‘lda uzaytiriladi.",
    renewAuto: "Avtomatik uzaytiriladi, istalgan vaqtda bekor qilish mumkin.",
    cta: {
      included: "Allaqachon kiritilgan",
      buy: "Rasmiylashtirish",
      request: "So‘rov yuborish",
      download: "Ilovani yuklab olish",
    },
    providers: {
      label: "To‘lov usuli",
      connecting: "Ulanmoqda",
    },
    checkout: {
      title: "Rasmiylashtirish",
      phoneLabel: "Telefon raqami",
      phoneHint: "O‘zbekiston raqami, masalan +998 90 123 45 67",
      sendCode: "Kod olish",
      codeLabel: "SMS dagi kod",
      codeHint: "Xabardagi olti raqam",
      confirm: "Tasdiqlash",
      changeNumber: "Raqamni o‘zgartirish",
      signedIn: "Kirish bajarildi",
      signOut: "Chiqish",
      currentPlan: "Amaldagi tarif",
      until: "{date} gacha amal qiladi",
      pay: "To‘lovga o‘tish",
      requestSent: "So‘rov yuborildi — biz siz bilan bog‘lanamiz.",
      ownerOnly: "To‘lovni tashkilot egasi rasmiylashtiradi.",
      storeManaged:
        "Obuna ilovalar do‘konida rasmiylashtirilgan. Uni o‘sha yerda boshqarish mumkin.",
      uzPhoneOnly:
        "Saytda to‘lov O‘zbekiston raqami bilan mumkin. So‘rov yuboring — boshqa usulni taklif qilamiz.",
      pricesPending:
        "Narxlar hali muhokama qilinmoqda. So‘rov yuboring — to‘lov ochilganda xabar beramiz.",
    },
    errors: {
      rate: "Juda tez. {seconds} s dan keyin qayta urinib ko‘ring.",
      rateLater: "Juda tez. Keyinroq urinib ko‘ring.",
      forbidden: "To‘lovni tashkilot egasi rasmiylashtiradi.",
      store: "Obuna ilovalar do‘konida rasmiylashtirilgan. Uni o‘sha yerda boshqarish mumkin.",
      unavailable: "Onlayn to‘lov ulanmoqda. Bizga yozing — ruxsatni ochamiz.",
      requestOnly: "Bu tarif so‘rov bo‘yicha rasmiylashtiriladi.",
      noOrganization: "Tashkilot topilmadi. Qaytadan kiring.",
      signedOut: "Sessiya tugadi. Qaytadan kiring.",
      network: "Server bilan bog‘lanib bo‘lmadi. Yana urinib ko‘ring.",
      phoneInvalid:
        "Raqamni tekshiring: O‘zbekiston raqami kerak, masalan +998 90 123 45 67.",
      codeInvalid: "SMS dagi kod — olti raqam.",
      pricesPending: "To‘lov hozircha ochilmagan.",
    },
  },
```

- [ ] **Step 4: Перевести раздел на английский**

В `lib/i18n/dictionaries/en.ts`:

```ts
  billing: {
    nav: "Pricing",
    metaTitle: "MyTamga pricing — subscriptions for importers and brokers",
    metaDescription:
      "MyTamga pricing: what each plan includes, how many team seats it carries, and how to subscribe for the app.",
    kicker: "Pricing",
    title: "MyTamga subscription",
    lead: "One subscription for the app and the site. A plan bought here opens on every device.",
    pricePending: "Under discussion",
    perMonth: "{amount} UZS/month",
    perYear: "{amount} UZS/year",
    free: "Free",
    freeForever: "Free forever — not a trial",
    byRequest: "On request",
    fromMonthly: "from {amount} UZS/month",
    period: {
      label: "Billing period",
      monthly: "Monthly",
      yearly: "Yearly",
    },
    yearlyAs: "A year costs as much as {months} months",
    seatsIncluded: "{count} team seats",
    extraSeat: "{amount} UZS per extra seat",
    unlimited: "Unlimited",
    catalogUnavailable:
      "Prices are temporarily unavailable. Write to us and we will send the current terms.",
    renewManual: "A single payment for 30 days. Renewed manually.",
    renewAuto: "Renews automatically; cancel at any time.",
    cta: {
      included: "Already included",
      buy: "Subscribe",
      request: "Request",
      download: "Get the app",
    },
    providers: {
      label: "Payment method",
      connecting: "Being connected",
    },
    checkout: {
      title: "Checkout",
      phoneLabel: "Phone number",
      phoneHint: "An Uzbek number, for example +998 90 123 45 67",
      sendCode: "Send the code",
      codeLabel: "Code from the SMS",
      codeHint: "Six digits from the message",
      confirm: "Confirm",
      changeNumber: "Change the number",
      signedIn: "Signed in",
      signOut: "Sign out",
      currentPlan: "Current plan",
      until: "Active until {date}",
      pay: "Continue to payment",
      requestSent: "Request sent — we will get in touch.",
      ownerOnly: "Only the organisation owner can pay.",
      storeManaged:
        "This subscription was bought in an app store. Manage it there.",
      uzPhoneOnly:
        "Paying on the site needs an Uzbek phone number. Send a request and we will offer another way.",
      pricesPending:
        "Prices are still under discussion. Send a request and we will tell you when payment opens.",
    },
    errors: {
      rate: "Too often. Try again in {seconds} s.",
      rateLater: "Too often. Try again later.",
      forbidden: "Only the organisation owner can pay.",
      store: "This subscription was bought in an app store. Manage it there.",
      unavailable: "Online payment is being connected. Write to us and we will set up access.",
      requestOnly: "This plan is arranged on request.",
      noOrganization: "Organisation not found. Please sign in again.",
      signedOut: "The session has expired. Please sign in again.",
      network: "Could not reach the server. Please try again.",
      phoneInvalid: "Check the number: an Uzbek one is needed, for example +998 90 123 45 67.",
      codeInvalid: "The code from the SMS is six digits.",
      pricesPending: "Payment is not open yet.",
    },
  },
```

- [ ] **Step 5: Перевести раздел на китайский**

В `lib/i18n/dictionaries/zh.ts`:

```ts
  billing: {
    nav: "价格",
    metaTitle: "MyTamga 价格 — 面向进口商与报关公司的订阅",
    metaDescription:
      "MyTamga 价格：每个套餐包含什么、团队席位多少，以及如何为应用开通订阅。",
    kicker: "价格",
    title: "MyTamga 订阅",
    lead: "应用与网站共用一份订阅。在此开通的套餐在所有设备上都可使用。",
    pricePending: "价格商议中",
    perMonth: "{amount} 苏姆/月",
    perYear: "{amount} 苏姆/年",
    free: "免费",
    freeForever: "永久免费，不是试用期",
    byRequest: "需申请",
    fromMonthly: "{amount} 苏姆/月起",
    period: {
      label: "付费周期",
      monthly: "按月",
      yearly: "按年",
    },
    yearlyAs: "一年相当于 {months} 个月的费用",
    seatsIncluded: "团队 {count} 个席位",
    extraSeat: "每增加一个席位 {amount} 苏姆",
    unlimited: "不限量",
    catalogUnavailable: "价格暂时无法显示。请联系我们，我们会发送现行条款。",
    renewManual: "一次性付费，有效期 30 天，需手动续费。",
    renewAuto: "自动续费，可随时取消。",
    cta: {
      included: "已包含",
      buy: "开通",
      request: "申请",
      download: "下载应用",
    },
    providers: {
      label: "付款方式",
      connecting: "接入中",
    },
    checkout: {
      title: "开通订阅",
      phoneLabel: "手机号",
      phoneHint: "乌兹别克斯坦号码，例如 +998 90 123 45 67",
      sendCode: "获取验证码",
      codeLabel: "短信验证码",
      codeHint: "短信中的六位数字",
      confirm: "确认",
      changeNumber: "更换号码",
      signedIn: "已登录",
      signOut: "退出",
      currentPlan: "当前套餐",
      until: "有效期至 {date}",
      pay: "前往付款",
      requestSent: "申请已提交，我们会与您联系。",
      ownerOnly: "只有组织所有者可以付款。",
      storeManaged: "该订阅在应用商店开通，请在商店中管理。",
      uzPhoneOnly:
        "在网站付款需要乌兹别克斯坦手机号。请提交申请，我们会提供其他方式。",
      pricesPending: "价格仍在商议中。请提交申请，开通付款后我们会通知您。",
    },
    errors: {
      rate: "操作过于频繁，请在 {seconds} 秒后重试。",
      rateLater: "操作过于频繁，请稍后重试。",
      forbidden: "只有组织所有者可以付款。",
      store: "该订阅在应用商店开通，请在商店中管理。",
      unavailable: "在线付款正在接入。请联系我们，我们会为您开通。",
      requestOnly: "该套餐需通过申请开通。",
      noOrganization: "未找到组织，请重新登录。",
      signedOut: "会话已过期，请重新登录。",
      network: "无法连接服务器，请重试。",
      phoneInvalid: "请检查号码：需要乌兹别克斯坦号码，例如 +998 90 123 45 67。",
      codeInvalid: "短信验证码为六位数字。",
      pricesPending: "付款尚未开通。",
    },
  },
```

- [ ] **Step 6: Написать падающий тест на карты подписей**

Создать `tests/label-maps.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { FEATURE_LABELS, LIMIT_LABELS } from "../lib/billing/label-maps.ts";

// Ключи каталога на 26.09.2026, снятые с BILLING_FEATURE_REGISTRY и
// BILLING_LIMIT_REGISTRY. Каталог может пополниться — тогда браузерная
// проверка labels.mjs скажет об этом, а страница покажет русскую подпись.
const FEATURES = [
  "standard_calculation", "case_save", "export", "ai_check",
  "advanced_calculation", "advanced_explanation", "version_history",
  "scenario_compare", "multi_line_cases", "declarant_chat",
  "client_management", "declarant_team", "priority_processing",
  "personal_manager", "manual_rate_verification", "manual_tnved_verification",
];

const LIMITS = [
  "calculations_per_month", "active_cases", "cases_per_month",
  "ai_checks_per_month", "pdf_exports_per_month", "team_seats",
];

test("русского в картах нет: подписи берутся из каталога", () => {
  assert.equal("ru" in FEATURE_LABELS, false);
  assert.equal("ru" in LIMIT_LABELS, false);
});

test("три языка переводят все известные возможности", () => {
  for (const locale of ["uz", "en", "zh"] as const) {
    for (const key of FEATURES) {
      assert.ok(FEATURE_LABELS[locale]?.[key], `${locale}: нет подписи для ${key}`);
    }
  }
});

test("три языка переводят все известные лимиты", () => {
  for (const locale of ["uz", "en", "zh"] as const) {
    for (const key of LIMITS) {
      assert.ok(LIMIT_LABELS[locale]?.[key], `${locale}: нет подписи для ${key}`);
    }
  }
});

test("лишних ключей в картах нет — иначе они переживут удаление из каталога", () => {
  for (const locale of ["uz", "en", "zh"] as const) {
    assert.deepEqual(Object.keys(FEATURE_LABELS[locale] ?? {}).sort(), [...FEATURES].sort());
    assert.deepEqual(Object.keys(LIMIT_LABELS[locale] ?? {}).sort(), [...LIMITS].sort());
  }
});
```

- [ ] **Step 7: Убедиться, что тест падает**

Run: `npm test`
Expected: FAIL — `Cannot find module '../lib/billing/label-maps.ts'`

- [ ] **Step 8: Создать карты подписей**

Создать `lib/billing/label-maps.ts`:

```ts
import type { LabelMap } from "./labels.ts";

// REVIEW(translation): узбекские и китайские подписи — черновик, до запуска их
// должен проверить носитель языка. Ключи совпадают с каталогом тарифов;
// русского здесь нет намеренно: каталог отдаёт русские подписи сам.
//
// Узбекский: o‘/g‘ пишутся через U+2018, как во всех словарях сайта.

type Maps = { uz: LabelMap; en: LabelMap; zh: LabelMap };

export const FEATURE_LABELS: Partial<Maps> = {
  uz: {
    standard_calculation: "Asosiy hisob-kitob",
    case_save: "Ishga saqlash",
    export: "PDF eksport",
    ai_check: "AI tekshiruvi",
    advanced_calculation: "Kengaytirilgan hisob-kitob",
    advanced_explanation: "Stavkalar izohi",
    version_history: "Versiyalar tarixi",
    scenario_compare: "Variantlarni solishtirish",
    multi_line_cases: "Ko‘p qatorli ishlar",
    declarant_chat: "Deklarant bilan chat",
    client_management: "O‘z mijozlaringiz",
    declarant_team: "Deklarantlar jamoasi",
    priority_processing: "Ustuvor ko‘rib chiqish",
    personal_manager: "Shaxsiy menejer",
    manual_rate_verification: "Stavkalarni qo‘lda tekshirish",
    manual_tnved_verification: "TIF TN kodini qo‘lda tekshirish",
  },
  en: {
    standard_calculation: "Basic calculation",
    case_save: "Save to a case",
    export: "PDF export",
    ai_check: "AI review",
    advanced_calculation: "Advanced calculation",
    advanced_explanation: "Rate explanations",
    version_history: "Version history",
    scenario_compare: "Scenario comparison",
    multi_line_cases: "Multi-line cases",
    declarant_chat: "Chat with a declarant",
    client_management: "Your own clients",
    declarant_team: "Declarant team",
    priority_processing: "Priority processing",
    personal_manager: "Personal manager",
    manual_rate_verification: "Manual rate verification",
    manual_tnved_verification: "Manual HS code verification",
  },
  zh: {
    standard_calculation: "基础计算",
    case_save: "保存到案例",
    export: "PDF 导出",
    ai_check: "AI 校验",
    advanced_calculation: "高级计算",
    advanced_explanation: "税率说明",
    version_history: "版本历史",
    scenario_compare: "方案对比",
    multi_line_cases: "多行案例",
    declarant_chat: "与报关员沟通",
    client_management: "客户管理",
    declarant_team: "报关团队",
    priority_processing: "优先处理",
    personal_manager: "专属客户经理",
    manual_rate_verification: "人工核对税率",
    manual_tnved_verification: "人工核对商品编码",
  },
};

export const LIMIT_LABELS: Partial<Maps> = {
  uz: {
    calculations_per_month: "Oyiga hisob-kitoblar",
    active_cases: "Faol ishlar",
    cases_per_month: "Oyiga ishlar",
    ai_checks_per_month: "Oyiga AI tekshiruvlari",
    pdf_exports_per_month: "Oyiga PDF eksportlar",
    team_seats: "Jamoadagi o‘rinlar",
  },
  en: {
    calculations_per_month: "Calculations per month",
    active_cases: "Active cases",
    cases_per_month: "Cases per month",
    ai_checks_per_month: "AI reviews per month",
    pdf_exports_per_month: "PDF exports per month",
    team_seats: "Team seats",
  },
  zh: {
    calculations_per_month: "每月计算次数",
    active_cases: "进行中的案例",
    cases_per_month: "每月案例数",
    ai_checks_per_month: "每月 AI 校验次数",
    pdf_exports_per_month: "每月 PDF 导出次数",
    team_seats: "团队席位",
  },
};
```

- [ ] **Step 9: Проверить**

Run: `npm test && npm run typecheck`
Expected: PASS, четыре новых теста; typecheck чистый — все четыре словаря совпали по ключам.

- [ ] **Step 10: Коммит**

```bash
git add lib/i18n/dictionaries lib/billing/label-maps.ts tests/label-maps.test.ts
git commit -m "feat: pricing and checkout copy in four languages"
```

---

## Task 12: Витрина тарифов

**Files:**
- Create: `lib/i18n/interpolate.ts`
- Create: `components/pricing/pricing-provider.tsx`
- Create: `components/pricing/plan-cta.tsx`
- Create: `components/pricing/plan-card.tsx`
- Create: `components/pricing/plan-grid.tsx`
- Create: `app/[lang]/pricing/page.tsx`
- Test: `tests/interpolate.test.ts`

**Interfaces:**
- Consumes: `loadPlans`, `loadProviders` (задача 3); `PRICES_PUBLISHED`, `AUTORENEW_AVAILABLE` (задача 3); `groupDigits`, `yearlyMonths` (задача 1); `labelFor` (задача 10); `FEATURE_LABELS`, `LIMIT_LABELS` (задача 11); `Dictionary["billing"]` (задача 11).
- Produces: `fill(template: string, values: Record<string, string | number>): string`; `usePricing()` с `{ period, setPeriod, selected, select }`; `<PricingProvider>`, `<PlanGrid>`, `<PlanCard>`, `<PlanCta>`.

Карточки остаются серверными: цены обязаны попасть в HTML. Интерактивность
живёт в тонком клиентском провайдере, который оборачивает серверные дети —
тогда переключатель периода и выбор тарифа работают, а разметка не уходит в
браузер. Обе цены, месячная и годовая, рендерятся сразу, и переключатель
показывает нужную: так поисковик видит обе, а на переключении ничего не
дёргается.

- [ ] **Step 1: Написать падающий тест подстановки**

Создать `tests/interpolate.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { fill } from "../lib/i18n/interpolate.ts";

test("подставляет значения по имени", () => {
  assert.equal(fill("{amount} сум/мес", { amount: "39 000" }), "39 000 сум/мес");
  assert.equal(fill("Год стоит как {months} месяцев", { months: 10 }), "Год стоит как 10 месяцев");
});

test("подставляет одно имя несколько раз", () => {
  assert.equal(fill("{a} и ещё {a}", { a: "раз" }), "раз и ещё раз");
});

test("неизвестное место остаётся как есть, а не становится undefined", () => {
  // Слово "undefined" на странице тарифов выглядит как сломанный сайт.
  assert.equal(fill("{amount} сум", {}), "{amount} сум");
});

test("текст без подстановок не меняется", () => {
  assert.equal(fill("Бесплатно", { amount: "39 000" }), "Бесплатно");
});
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `npm test`
Expected: FAIL — `Cannot find module '../lib/i18n/interpolate.ts'`

- [ ] **Step 3: Реализовать подстановку**

Создать `lib/i18n/interpolate.ts`:

```ts
/**
 * Подстановка в строку словаря: `{amount}`, `{seconds}`, `{date}`.
 * Неизвестное место остаётся текстом — увидеть `{amount}` неприятно, но это
 * честная поломка, а `undefined` на странице тарифов выглядит как сбой сайта.
 */
export function fill(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}
```

- [ ] **Step 4: Создать клиентский провайдер**

Создать `components/pricing/pricing-provider.tsx`:

```tsx
"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type BillingPeriod = "monthly" | "yearly";

type PricingState = {
  period: BillingPeriod;
  setPeriod: (period: BillingPeriod) => void;
  selected: string | null;
  select: (planKey: string) => void;
};

const PricingContext = createContext<PricingState | null>(null);

/**
 * Тонкая клиентская оболочка вокруг серверной разметки: состояние здесь,
 * а карточки с ценами остаются серверными и попадают в HTML.
 */
export function PricingProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [selected, setSelected] = useState<string | null>(null);

  const value = useMemo<PricingState>(
    () => ({ period, setPeriod, selected, select: setSelected }),
    [period, selected],
  );

  return (
    <PricingContext.Provider value={value}>
      {/* Период открыт разметке атрибутом: цены прячет CSS, без повторного
          рендера серверных карточек. */}
      <div data-period={period}>{children}</div>
    </PricingContext.Provider>
  );
}

export function usePricing(): PricingState {
  const value = useContext(PricingContext);

  if (!value) {
    throw new Error("usePricing must be used inside PricingProvider");
  }

  return value;
}
```

- [ ] **Step 5: Добавить правила видимости цены**

В `app/globals.css`, в конец файла:

```css
/* Обе цены есть в разметке: поисковик видит и месячную, и годовую, а
   переключатель только меняет, какая показана — поэтому при переключении
   ничего не дёргается и серверные карточки не перерисовываются.
   Раскладочных display здесь нет: скрываем видимостью потока, а не сеткой. */
[data-period="monthly"] .plan-price-yearly,
[data-period="yearly"] .plan-price-monthly {
  display: none;
}
```

- [ ] **Step 6: Создать кнопку тарифа**

Создать `components/pricing/plan-cta.tsx`:

```tsx
"use client";

import { usePricing } from "@/components/pricing/pricing-provider";

interface PlanCtaProps {
  planKey: string;
  label: string;
}

/**
 * Единственная клиентская часть карточки. Выбирает тариф и уводит к панели
 * оформления — панель ниже на той же странице, поэтому это не переход.
 */
export function PlanCta({ planKey, label }: PlanCtaProps) {
  const { select } = usePricing();

  return (
    <a
      href="#checkout"
      className="liquid-metal-trigger mt-8 inline-flex h-11 items-center justify-center rounded-full border border-line px-6 text-sm font-semibold text-[var(--ink)] transition-colors hover:border-[var(--accent)]"
      onClick={() => select(planKey)}
    >
      {label}
    </a>
  );
}
```

- [ ] **Step 7: Создать карточку тарифа**

Создать `components/pricing/plan-card.tsx`:

```tsx
import { Check } from "lucide-react";

import { PlanCta } from "@/components/pricing/plan-cta";
import { LiquidMetalPanel } from "@/components/ui/liquid-metal-panel";
import { PRICES_PUBLISHED } from "@/lib/billing/flags";
import type { BillingPlan } from "@/lib/billing/catalog";
import { groupDigits, yearlyMonths } from "@/lib/billing/format";
import { FEATURE_LABELS, LIMIT_LABELS } from "@/lib/billing/label-maps";
import { labelFor } from "@/lib/billing/labels";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";
import { fill } from "@/lib/i18n/interpolate";

interface PlanCardProps {
  plan: BillingPlan;
  strings: Dictionary["billing"];
  locale: Locale;
}

export function PlanCard({ plan, strings, locale }: PlanCardProps) {
  const features = FEATURE_LABELS[locale as "uz" | "en" | "zh"];
  const limits = LIMIT_LABELS[locale as "uz" | "en" | "zh"];
  const months = yearlyMonths(plan.priceMonthly, plan.priceYearly ?? 0);

  // Кнопка говорит правду о том, что произойдёт: бесплатный тариф не
  // «оформляют», а тариф по заявке и тариф без объявленной цены не покупают.
  const ctaLabel = plan.isRequestOnly
    ? strings.cta.request
    : plan.priceMonthly === 0
      ? strings.cta.included
      : PRICES_PUBLISHED
        ? strings.cta.buy
        : strings.cta.request;

  return (
    <LiquidMetalPanel
      className="h-full w-full"
      innerClassName="flex h-full flex-col px-7 pb-9 pt-8"
    >
      <h3 className="text-base font-semibold tracking-[-0.01em] text-[var(--ink)]">
        {plan.label}
      </h3>

      {plan.description && (
        <p className="mt-2 text-sm leading-6 text-ink-soft">{plan.description}</p>
      )}

      <div className="mt-7">
        {!PRICES_PUBLISHED && (
          <p className="text-sm font-semibold text-[var(--accent)]">
            {strings.pricePending}
          </p>
        )}

        {PRICES_PUBLISHED && plan.isRequestOnly && (
          <p className="text-sm font-semibold text-[var(--ink)]">
            {plan.priceMonthlyFrom
              ? fill(strings.fromMonthly, { amount: groupDigits(plan.priceMonthlyFrom) })
              : strings.byRequest}
          </p>
        )}

        {PRICES_PUBLISHED && !plan.isRequestOnly && plan.priceMonthly === 0 && (
          <>
            <p className="text-2xl font-semibold tracking-[-0.02em] text-[var(--ink)] [font-variant-numeric:tabular-nums]">
              {strings.free}
            </p>
            <p className="mt-2 text-xs leading-5 text-ink-faint">
              {strings.freeForever}
            </p>
          </>
        )}

        {PRICES_PUBLISHED && !plan.isRequestOnly && plan.priceMonthly > 0 && (
          <>
            <p className="plan-price-monthly text-2xl font-semibold tracking-[-0.02em] text-[var(--ink)] [font-variant-numeric:tabular-nums]">
              {fill(strings.perMonth, { amount: groupDigits(plan.priceMonthly) })}
            </p>
            {plan.priceYearly !== null && plan.priceYearly > 0 && (
              <p className="plan-price-yearly text-2xl font-semibold tracking-[-0.02em] text-[var(--ink)] [font-variant-numeric:tabular-nums]">
                {fill(strings.perYear, { amount: groupDigits(plan.priceYearly) })}
              </p>
            )}
            {months !== null && (
              <p className="mt-2 text-xs leading-5 text-ink-faint">
                {fill(strings.yearlyAs, { months })}
              </p>
            )}
          </>
        )}
      </div>

      {plan.seatsIncluded !== null && (
        <p className="mt-5 text-sm text-ink-soft">
          {fill(strings.seatsIncluded, { count: plan.seatsIncluded })}
        </p>
      )}

      {plan.extraSeatPriceMonthly !== null && plan.extraSeatPriceMonthly > 0 && PRICES_PUBLISHED && (
        <p className="mt-1 text-xs leading-5 text-ink-faint">
          {fill(strings.extraSeat, { amount: groupDigits(plan.extraSeatPriceMonthly) })}
        </p>
      )}

      <ul className="mt-7 flex flex-col gap-2">
        {plan.features.map((feature) => (
          <li key={feature.key} className="flex items-start gap-2">
            <Check
              className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--accent)]"
              strokeWidth={2}
              aria-hidden="true"
            />
            <span className="text-sm leading-6 text-ink-soft">
              {labelFor(features, feature.key, feature.label)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="mt-7 flex flex-col gap-1.5 border-t border-line-soft pt-5">
        {plan.limits.map((limit) => (
          <div key={limit.key} className="flex items-baseline justify-between gap-4">
            <dt className="text-xs text-ink-faint">
              {labelFor(limits, limit.key, limit.label)}
            </dt>
            <dd className="text-xs text-ink-soft [font-variant-numeric:tabular-nums]">
              {limit.unlimited ? strings.unlimited : groupDigits(limit.value)}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-auto">
        <PlanCta planKey={plan.key} label={ctaLabel} />
      </div>
    </LiquidMetalPanel>
  );
}
```

- [ ] **Step 8: Создать сетку**

Создать `components/pricing/plan-grid.tsx`:

```tsx
import { PlanCard } from "@/components/pricing/plan-card";
import type { BillingPlan } from "@/lib/billing/catalog";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";

interface PlanGridProps {
  plans: BillingPlan[];
  strings: Dictionary["billing"];
  locale: Locale;
}

export function PlanGrid({ plans, strings, locale }: PlanGridProps) {
  return (
    <ul className="mt-14 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {plans.map((plan) => (
        <li key={plan.key} className="flex">
          <PlanCard plan={plan} strings={strings} locale={locale} />
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 9: Создать страницу**

Создать `app/[lang]/pricing/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PlanGrid } from "@/components/pricing/plan-grid";
import { PricingProvider } from "@/components/pricing/pricing-provider";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { AUTORENEW_AVAILABLE } from "@/lib/billing/flags";
import { loadPlans } from "@/lib/billing/plans.server";
import { HTML_LANG, LOCALES, hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/pricing">): Promise<Metadata> {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    return {};
  }

  const t = getDictionary(lang);

  return {
    title: t.billing.metaTitle,
    description: t.billing.metaDescription,
    alternates: {
      canonical: `/${lang}/pricing`,
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [HTML_LANG[l], `/${l}/pricing`])),
        "x-default": "/ru/pricing",
      },
    },
  };
}

export default async function PricingPage({ params }: PageProps<"/[lang]/pricing">) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const t = getDictionary(lang);
  const plans = await loadPlans();

  return (
    <>
      <main>
        <section
          id="pricing"
          className="section-anchor w-full px-[var(--gutter)] pb-24 pt-36 lg:pb-36 lg:pt-44"
          aria-labelledby="pricing-title"
        >
          <SectionHeading
            id="pricing-title"
            kicker={t.billing.kicker}
            title={t.billing.title}
          />

          <p className="mt-6 max-w-2xl text-sm leading-6 text-ink-soft">
            {t.billing.lead}
          </p>

          {/* Каталог недоступен — говорим прямо. Цены из кода не берём: устаревшая
              цена разошлась бы со списанием, а это хуже её отсутствия. */}
          {plans === null && (
            <p
              data-catalog="unavailable"
              className="mt-14 max-w-xl text-sm leading-6 text-ink-soft"
            >
              {t.billing.catalogUnavailable}
            </p>
          )}

          {plans !== null && (
            <PricingProvider>
              <PlanGrid plans={plans} strings={t.billing} locale={lang} />

              <p className="mt-10 text-xs leading-5 text-ink-faint">
                {AUTORENEW_AVAILABLE ? t.billing.renewAuto : t.billing.renewManual}
              </p>
            </PricingProvider>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
```

- [ ] **Step 10: Проверить в браузере**

Run: `npm run dev` в одном окне, `npm --prefix ~/Desktop/Projects/MyTamga run dev:api` — в другом. Открыть `http://localhost:3000/ru/pricing`.
Expected: четыре карточки; вместо каждой суммы — «В процессе обсуждения»; кнопки говорят «Запросить», кроме Basic; список возможностей и лимитов заполнен.

- [ ] **Step 11: Проверить состояние без каталога**

Run: остановить API приложения и перезапустить `npm run dev`, открыть `/ru/pricing`.
Expected: строка «Цены временно недоступны…», сетка отсутствует, страница не падает.

- [ ] **Step 12: Проверить типы и линт**

Run: `npm test && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 13: Коммит**

```bash
git add lib/i18n/interpolate.ts components/pricing app/[lang]/pricing app/globals.css tests/interpolate.test.ts
git commit -m "feat: the tariff page, with prices straight from the catalog"
```

---

## Task 13: Переключатель периода

**Files:**
- Create: `components/pricing/period-toggle.tsx`
- Modify: `app/[lang]/pricing/page.tsx` (вставить переключатель над сеткой)

**Interfaces:**
- Consumes: `usePricing` (задача 12), `Dictionary["billing"]["period"]` (задача 11), `PRICES_PUBLISHED` (задача 3).
- Produces: `<PeriodToggle strings={…} />`.

Материал тот же, что у переключателей темы и языка: `.lss`, `.cts-groove`,
`.cts-gloss`, `.cts-occlusion`, `.lss-thumb`. Третий вид тумблера на сайте не
заводим. Ползунок на две позиции — ширина `calc((100% - 8px) / 2)`, положение
через `--lss-index`, ровно как у языкового на четыре.

Пока цены не объявлены, переключатель не показывается: сравнивать нечего.

- [ ] **Step 1: Создать переключатель**

Создать `components/pricing/period-toggle.tsx`:

```tsx
"use client";

import type { CSSProperties } from "react";

import { usePricing, type BillingPeriod } from "@/components/pricing/pricing-provider";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";

const PERIODS: BillingPeriod[] = ["monthly", "yearly"];

export function PeriodToggle({
  strings,
}: {
  strings: Dictionary["billing"]["period"];
}) {
  const { period, setPeriod } = usePricing();
  const index = PERIODS.indexOf(period);

  // Радиогруппа, а не навигация: период не меняет адрес страницы. Поэтому
  // здесь настоящие radio, а не ссылки, как в переключателе языка.
  return (
    <fieldset
      data-period-toggle
      className="lss relative inline-flex h-10 w-[200px] shrink-0 rounded-full border-[1.5px] p-1"
      style={{ "--lss-index": index } as CSSProperties}
    >
      <legend className="sr-only">{strings.label}</legend>

      <span className="cts-groove pointer-events-none absolute inset-[2px] rounded-full" aria-hidden="true" />
      <span className="cts-gloss pointer-events-none absolute inset-0 rounded-full" aria-hidden="true" />
      <span className="cts-occlusion pointer-events-none absolute inset-0 rounded-full" aria-hidden="true" />

      <span
        className="lss-thumb pointer-events-none absolute bottom-1 left-1 top-1 overflow-hidden rounded-full border"
        style={{ width: "calc((100% - 8px) / 2)" }}
        aria-hidden="true"
      >
        <span className="cts-thumb-shine pointer-events-none absolute inset-0 rounded-full" />
      </span>

      <div className="relative z-10 grid h-full w-full grid-cols-2">
        {PERIODS.map((option) => (
          <label
            key={option}
            data-active={option === period}
            className="lss-link flex h-full w-full cursor-pointer items-center justify-center rounded-full text-xs font-semibold tracking-[0.02em]"
          >
            <input
              type="radio"
              name="billing-period"
              value={option}
              checked={option === period}
              onChange={() => setPeriod(option)}
              className="sr-only"
            />
            {option === "monthly" ? strings.monthly : strings.yearly}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
```

- [ ] **Step 2: Вставить переключатель на страницу**

В `app/[lang]/pricing/page.tsx` добавить импорты:

```tsx
import { PeriodToggle } from "@/components/pricing/period-toggle";
import { AUTORENEW_AVAILABLE, PRICES_PUBLISHED } from "@/lib/billing/flags";
```

и внутри `<PricingProvider>`, перед `<PlanGrid …>`:

```tsx
              {/* Пока цены не объявлены, сравнивать нечего. */}
              {PRICES_PUBLISHED && (
                <div className="mt-10">
                  <PeriodToggle strings={t.billing.period} />
                </div>
              )}
```

- [ ] **Step 3: Проверить, что сейчас его нет**

Run: открыть `http://localhost:3000/ru/pricing`.
Expected: переключателя нет — `PRICES_PUBLISHED` равен `false`.

- [ ] **Step 4: Проверить его вручную при включённом флаге**

Временно поменять `PRICES_PUBLISHED` на `true` в `lib/billing/flags.ts`, открыть страницу.
Expected: переключатель на месте; «Год» показывает годовую цену, «Месяц» — месячную; ползунок доезжает с той же пружиной, что у языкового; клавиатурой период переключается стрелками.
**Вернуть флаг в `false` перед коммитом** и убедиться, что `npm test` снова зелёный.

- [ ] **Step 5: Проверить типы и линт**

Run: `npm test && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 6: Коммит**

```bash
git add components/pricing/period-toggle.tsx app/[lang]/pricing/page.tsx
git commit -m "feat: monthly and yearly toggle on the shared switch material"
```

---

## Task 14: Панель оформления

**Files:**
- Create: `lib/billing/messages.ts`
- Create: `lib/api/client.ts`
- Create: `components/pricing/checkout-panel.tsx`
- Modify: `app/[lang]/pricing/page.tsx` (передать провайдеров и вставить панель)
- Test: `tests/messages.test.ts`

**Interfaces:**
- Consumes: `BillingErrorCode` (задача 4), `fill` (задача 12), `usePricing` (задача 12), `SubscriptionView` (задача 9), `BillingProvider` (задача 2), `Dictionary["billing"]` (задача 11), `PRICES_PUBLISHED` (задача 3).
- Produces: `messageFor(code, retryAfter, strings): string`; `type ApiResult<T>`, `getJson<T>(path)`, `postJson<T>(path, body)`; `<CheckoutPanel>`.

Панель не даёт упереться в отказ: она сначала читает подписку и, если человек
не владелец организации или подписка пришла из магазина, показывает причину
вместо кнопки. Это те самые 403 и 409, которые иначе прилетели бы в лицо уже
после нажатия.

- [ ] **Step 1: Написать падающий тест сообщений**

Создать `tests/messages.test.ts`:

```ts
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
});

test("неизвестный код не оставляет человека без объяснения", () => {
  // Сервер может однажды ответить кодом, которого мы не знаем.
  assert.equal(
    messageFor("что-то новое" as never, null, strings),
    strings.network,
  );
});
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `npm test`
Expected: FAIL — `Cannot find module '../lib/billing/messages.ts'`

- [ ] **Step 3: Реализовать сообщения**

Создать `lib/billing/messages.ts`:

```ts
import type { BillingErrorCode } from "../api/errors.ts";

type ErrorStrings = Record<string, string>;

/**
 * Код отказа в предложение на языке страницы. Русский текст сервера сюда не
 * попадает: он остаётся в логе, а человек читает свой язык.
 */
export function messageFor(
  code: BillingErrorCode,
  retryAfter: number | null | undefined,
  strings: ErrorStrings,
): string {
  if (code === "rate") {
    // Задержку длиннее десяти минут не называют в секундах.
    return typeof retryAfter === "number"
      ? strings.rate.replace("{seconds}", String(retryAfter))
      : strings.rateLater;
  }

  return strings[code] ?? strings.network;
}
```

Импорт с расширением `.ts` — так этот модуль читается и сборкой Next, и
`node --test` без алиасов.

- [ ] **Step 4: Реализовать клиент наших ручек**

Создать `lib/api/client.ts`:

```ts
import type { BillingErrorCode } from "./errors";

export type ApiResult<T> =
  | ({ ok: true } & T)
  | { ok: false; code: BillingErrorCode; retryAfter?: number | null };

/**
 * Браузер обращается только к нашему домену. Наши ручки всегда отвечают 200:
 * код отказа лежит в теле, поэтому разбирать статусы здесь не нужно.
 */
async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const response = await fetch(path, {
      ...init,
      headers: { "content-type": "application/json", ...init?.headers },
    });

    const payload = (await response.json()) as ApiResult<T>;

    return payload?.ok === true ? payload : payload ?? { ok: false, code: "network" };
  } catch {
    return { ok: false, code: "network" };
  }
}

export function getJson<T>(path: string): Promise<ApiResult<T>> {
  return request<T>(path);
}

export function postJson<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  return request<T>(path, { method: "POST", body: JSON.stringify(body) });
}
```

- [ ] **Step 5: Создать панель**

Создать `components/pricing/checkout-panel.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

import { usePricing } from "@/components/pricing/pricing-provider";
import { LiquidMetalPanel } from "@/components/ui/liquid-metal-panel";
import { TextField } from "@/components/ui/text-field";
import { getJson, postJson } from "@/lib/api/client";
import type { BillingProvider } from "@/lib/billing/catalog";
import { PRICES_PUBLISHED } from "@/lib/billing/flags";
import { messageFor } from "@/lib/billing/messages";
import type { SubscriptionView } from "@/lib/billing/subscription";
import { HTML_LANG, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";
import { fill } from "@/lib/i18n/interpolate";

interface CheckoutPanelProps {
  strings: Dictionary["billing"];
  locale: Locale;
  providers: BillingProvider[];
}

type Session = "unknown" | "anonymous" | "signed";

export function CheckoutPanel({ strings, locale, providers }: CheckoutPanelProps) {
  const { selected } = usePricing();
  const [session, setSession] = useState<Session>("unknown");
  const [subscription, setSubscription] = useState<SubscriptionView | null>(null);
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const online = providers.filter((provider) => provider.online);
  const [provider, setProvider] = useState(online[0]?.key ?? "");

  // На en и zh оплата всё равно требует узбекского номера: так устроен сервер
  // приложения, и молчать об этом значит вести человека в тупик.
  const needsUzNotice = locale === "en" || locale === "zh";

  async function loadSubscription() {
    const result = await getJson<{ subscription: SubscriptionView }>("/api/subscription");

    if (result.ok) {
      setSubscription(result.subscription);
      setSession("signed");
      return;
    }

    setSubscription(null);
    setSession("anonymous");
  }

  // Человек мог войти раньше: куки живут дольше страницы.
  useEffect(() => {
    void loadSubscription();
  }, []);

  async function act(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  const requestCode = () =>
    act(async () => {
      const result = await postJson("/api/session/request-code", { phone });

      if (!result.ok) {
        setError(messageFor(result.code, result.retryAfter, strings.errors));
        return;
      }

      setStep("code");
    });

  const verifyCode = () =>
    act(async () => {
      const result = await postJson("/api/session/verify-code", { phone, code });

      if (!result.ok) {
        setError(messageFor(result.code, result.retryAfter, strings.errors));
        return;
      }

      setCode("");
      await loadSubscription();
    });

  const pay = () =>
    act(async () => {
      const result = await postJson<{ url: string }>("/api/checkout", {
        planKey: selected,
        provider,
      });

      if (!result.ok) {
        setError(messageFor(result.code, result.retryAfter, strings.errors));
        return;
      }

      window.location.assign(result.url);
    });

  const requestPlan = () =>
    act(async () => {
      const result = await postJson("/api/upgrade-request", { planKey: selected });

      if (!result.ok) {
        setError(messageFor(result.code, result.retryAfter, strings.errors));
        return;
      }

      setNotice(strings.checkout.requestSent);
    });

  const signOut = () =>
    act(async () => {
      await postJson("/api/session/logout", {});
      setSubscription(null);
      setSession("anonymous");
      setStep("phone");
    });

  const until =
    subscription?.nextBillingAt &&
    new Intl.DateTimeFormat(HTML_LANG[locale], { dateStyle: "long" }).format(
      new Date(subscription.nextBillingAt),
    );

  // Причина, по которой оплаты не будет, известна до нажатия.
  const blocked = !PRICES_PUBLISHED
    ? strings.checkout.pricesPending
    : subscription?.isStoreManaged
      ? strings.checkout.storeManaged
      : subscription && !subscription.canManageSubscription
        ? strings.checkout.ownerOnly
        : online.length === 0
          ? strings.errors.unavailable
          : null;

  return (
    <section
      id="checkout"
      data-checkout
      data-session={session}
      className="section-anchor mt-20 max-w-xl"
      aria-labelledby="checkout-title"
    >
      <LiquidMetalPanel innerClassName="flex flex-col gap-5 px-7 pb-9 pt-8">
        <h3
          id="checkout-title"
          className="text-base font-semibold tracking-[-0.01em] text-[var(--ink)]"
        >
          {strings.checkout.title}
        </h3>

        {needsUzNotice && (
          <p className="text-sm leading-6 text-ink-soft">
            {strings.checkout.uzPhoneOnly}
          </p>
        )}

        {session !== "signed" && step === "phone" && (
          <>
            <TextField
              id="checkout-phone"
              name="phone"
              type="tel"
              label={strings.checkout.phoneLabel}
              placeholder={strings.checkout.phoneHint}
              autoComplete="tel"
              defaultValue={phone}
            />
            <button
              type="button"
              data-action="request-code"
              disabled={busy}
              onClick={requestCode}
              className="liquid-metal-trigger inline-flex h-11 items-center justify-center rounded-full border border-line px-6 text-sm font-semibold text-[var(--ink)]"
            >
              {strings.checkout.sendCode}
            </button>
          </>
        )}

        {session !== "signed" && step === "code" && (
          <>
            <TextField
              id="checkout-code"
              name="code"
              type="text"
              label={strings.checkout.codeLabel}
              placeholder={strings.checkout.codeHint}
              autoComplete="one-time-code"
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                data-action="verify-code"
                disabled={busy}
                onClick={verifyCode}
                className="liquid-metal-trigger inline-flex h-11 items-center justify-center rounded-full border border-line px-6 text-sm font-semibold text-[var(--ink)]"
              >
                {strings.checkout.confirm}
              </button>
              <button
                type="button"
                onClick={() => setStep("phone")}
                className="nav-link text-sm"
              >
                {strings.checkout.changeNumber}
              </button>
            </div>
          </>
        )}

        {session === "signed" && subscription && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-ink-soft">
              {strings.checkout.currentPlan}: {subscription.planLabel}
            </p>
            {until && (
              <p className="text-xs text-ink-faint">
                {fill(strings.checkout.until, { date: until })}
              </p>
            )}
          </div>
        )}

        {session === "signed" && online.length > 1 && !blocked && (
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm text-ink-soft">{strings.providers.label}</legend>
            {online.map((entry) => (
              <label key={entry.key} className="flex items-center gap-2 text-sm text-ink-soft">
                <input
                  type="radio"
                  name="provider"
                  value={entry.key}
                  checked={provider === entry.key}
                  onChange={() => setProvider(entry.key)}
                />
                {entry.label}
              </label>
            ))}
          </fieldset>
        )}

        {session === "signed" && (
          <div className="flex flex-wrap items-center gap-3">
            {blocked === null && (
              <button
                type="button"
                data-action="pay"
                disabled={busy || !selected}
                onClick={pay}
                className="liquid-metal-trigger inline-flex h-11 items-center justify-center rounded-full border border-line px-6 text-sm font-semibold text-[var(--ink)]"
              >
                {strings.checkout.pay}
              </button>
            )}

            {blocked !== null && (
              <button
                type="button"
                data-action="request-plan"
                disabled={busy || !selected}
                onClick={requestPlan}
                className="liquid-metal-trigger inline-flex h-11 items-center justify-center rounded-full border border-line px-6 text-sm font-semibold text-[var(--ink)]"
              >
                {strings.cta.request}
              </button>
            )}

            <button type="button" onClick={signOut} className="nav-link text-sm">
              {strings.checkout.signOut}
            </button>
          </div>
        )}

        {blocked !== null && (
          <p data-blocked className="text-sm leading-6 text-ink-soft">
            {blocked}
          </p>
        )}

        <p aria-live="polite" data-checkout-status className="text-sm leading-6 text-ink-soft">
          {error ?? notice}
        </p>
      </LiquidMetalPanel>
    </section>
  );
}
```

- [ ] **Step 6: Связать поля со состоянием**

`TextField` отдаёт неуправляемый `input`, а панели нужны значения. Добавить в
`components/ui/text-field.tsx` два необязательных свойства, не меняя ни одного
существующего вызова:

```tsx
  value?: string;
  onValueChange?: (value: string) => void;
```

и в объект `shared`:

```tsx
    value,
    onChange: onValueChange
      ? (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
          onValueChange(event.target.value)
      : undefined,
```

Затем в панели заменить `defaultValue={phone}` на `value={phone}` и
`onValueChange={setPhone}`, а у поля кода добавить `value={code}` и
`onValueChange={setCode}`. Форма заявки на главной продолжает работать
по-старому: `value` там не передаётся.

Файл начинает нуждаться в `import type React from "react";` — добавить.

- [ ] **Step 7: Вставить панель на страницу**

В `app/[lang]/pricing/page.tsx` добавить импорты и загрузку провайдеров:

```tsx
import { CheckoutPanel } from "@/components/pricing/checkout-panel";
import { loadPlans, loadProviders } from "@/lib/billing/plans.server";
```

```tsx
  const [plans, providers] = await Promise.all([loadPlans(), loadProviders()]);
```

и внутри `<PricingProvider>`, после абзаца о продлении:

```tsx
              <CheckoutPanel
                strings={t.billing}
                locale={lang}
                providers={providers ?? []}
              />
```

- [ ] **Step 8: Проверить вручную**

Run: поднять API приложения (`npm --prefix ~/Desktop/Projects/MyTamga run dev:api`), открыть `/ru/pricing`, нажать «Запросить» на Pro, ввести номер, получить код через `npm --prefix ~/Desktop/Projects/MyTamga run otp:last`, подтвердить.
Expected: после входа видно текущий тариф; кнопки оплаты нет, вместо неё «Цены ещё обсуждаются…» и кнопка «Запросить»; заявка отправляется и отвечает «Заявка отправлена».

- [ ] **Step 9: Проверить**

Run: `npm test && npm run typecheck && npm run lint`
Expected: PASS, четыре новых теста.

- [ ] **Step 10: Коммит**

```bash
git add lib/billing/messages.ts lib/api/client.ts components/pricing/checkout-panel.tsx components/ui/text-field.tsx app/[lang]/pricing/page.tsx tests/messages.test.ts
git commit -m "feat: checkout panel that explains a refusal before it happens"
```

---

## Task 15: Страница возврата с оплаты

**Files:**
- Create: `lib/billing/poll.ts`
- Create: `components/pay/return-poller.tsx`
- Create: `app/[lang]/pay/return/page.tsx`
- Modify: `lib/i18n/dictionaries/{ru,uz,en,zh}.ts` (раздел `billing.pay`)
- Test: `tests/poll.test.ts`

**Interfaces:**
- Consumes: `SubscriptionView` (задача 9), `BillingErrorCode` (задача 4), `getJson` (задача 14), `COOKIE` (задача 5).
- Produces: `POLL_INTERVAL_MS`, `POLL_DEADLINE_MS`, тип `PollOutcome`, `pollOutcome(input): PollOutcome`.

Пятый пункт Review Focus. Провайдер сообщает серверу об оплате отдельным
запросом, и он может опоздать на секунды, поэтому страница спрашивает сервер, а
не верит адресу. Но если сессия истекла, крутить опрос минуту в пустоту нельзя:
человек должен сразу увидеть, что надо войти.

- [ ] **Step 1: Написать падающий тест**

Создать `tests/poll.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { POLL_DEADLINE_MS, POLL_INTERVAL_MS, pollOutcome } from "../lib/billing/poll.ts";

const active = {
  planKey: "pro",
  planLabel: "Pro",
  status: "active" as const,
  source: "site" as const,
  isStoreManaged: false,
  nextBillingAt: "2026-10-26T00:00:00.000Z",
  canManageSubscription: true,
  organizationName: null,
  seatsPurchased: 1,
  seatsUsed: 1,
};

test("опрос идёт каждые три секунды, не дольше минуты", () => {
  assert.equal(POLL_INTERVAL_MS, 3000);
  assert.equal(POLL_DEADLINE_MS, 60_000);
});

test("оплаченный тариф — успех", () => {
  assert.equal(
    pollOutcome({ subscription: active, elapsedMs: 3000, expectedPlanKey: "pro" }),
    "success",
  );
});

test("тариф ещё не включился — продолжаем ждать", () => {
  assert.equal(
    pollOutcome({ subscription: { ...active, planKey: "basic" }, elapsedMs: 3000, expectedPlanKey: "pro" }),
    "pending",
  );
  assert.equal(
    pollOutcome({ subscription: { ...active, status: "expired" }, elapsedMs: 3000, expectedPlanKey: "pro" }),
    "pending",
  );
});

test("без номера платежа успехом считается любой платный активный тариф", () => {
  // Куки платежа могло не остаться: человек вернулся через час или с другого
  // устройства. Ждать «именно pro» тогда неоткуда.
  assert.equal(pollOutcome({ subscription: active, elapsedMs: 3000, expectedPlanKey: null }), "success");
  assert.equal(
    pollOutcome({ subscription: { ...active, planKey: "basic" }, elapsedMs: 3000, expectedPlanKey: null }),
    "pending",
  );
});

test("истёкшая сессия прекращает опрос сразу, а не через минуту", () => {
  assert.equal(pollOutcome({ code: "signedOut", elapsedMs: 3000 }), "signedOut");
  assert.equal(pollOutcome({ code: "noOrganization", elapsedMs: 3000 }), "signedOut");
});

test("сетевая ошибка не прекращает опрос: сервер мог просто не ответить", () => {
  assert.equal(pollOutcome({ code: "network", elapsedMs: 3000 }), "pending");
});

test("по истечении минуты опрос останавливается", () => {
  assert.equal(pollOutcome({ subscription: { ...active, planKey: "basic" }, elapsedMs: 60_000, expectedPlanKey: "pro" }), "timeout");
  assert.equal(pollOutcome({ code: "network", elapsedMs: 61_000 }), "timeout");
});

test("успех перевешивает истечение времени", () => {
  // Последний ответ пришёл на шестидесятой секунде — это оплата, не таймаут.
  assert.equal(
    pollOutcome({ subscription: active, elapsedMs: 60_000, expectedPlanKey: "pro" }),
    "success",
  );
});
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `npm test`
Expected: FAIL — `Cannot find module '../lib/billing/poll.ts'`

- [ ] **Step 3: Реализовать решение об опросе**

Создать `lib/billing/poll.ts`:

```ts
import type { BillingErrorCode } from "../api/errors.ts";
import type { SubscriptionView } from "./subscription.ts";

export const POLL_INTERVAL_MS = 3000;
export const POLL_DEADLINE_MS = 60_000;

export type PollOutcome = "success" | "pending" | "signedOut" | "timeout";

/**
 * Что делать после очередного ответа сервера. Вынесено из компонента, потому
 * что именно здесь легко ошибиться: показать успех на бесплатном тарифе или
 * крутить опрос минуту, когда человеку надо просто войти заново.
 */
export function pollOutcome(input: {
  subscription?: SubscriptionView | null;
  code?: BillingErrorCode | null;
  elapsedMs: number;
  expectedPlanKey?: string | null;
}): PollOutcome {
  const { subscription, code, elapsedMs, expectedPlanKey } = input;

  if (subscription && subscription.status === "active") {
    const isExpected = expectedPlanKey
      ? subscription.planKey === expectedPlanKey
      : subscription.planKey !== "basic";

    // Успех проверяется до времени: ответ мог прийти на последней секунде.
    if (isExpected) {
      return "success";
    }
  }

  if (code === "signedOut" || code === "noOrganization") {
    return "signedOut";
  }

  if (elapsedMs >= POLL_DEADLINE_MS) {
    return "timeout";
  }

  return "pending";
}
```

- [ ] **Step 4: Добавить строки `billing.pay` в четыре словаря**

В `ru.ts`, внутрь `billing`, после `errors`:

```ts
    pay: {
      title: "Оплата",
      waiting: "Проверяем оплату…",
      success: "Оплачено. Откройте приложение MyTamga — тариф уже подключён.",
      timeout:
        "Платёж обрабатывается. Если тариф не появится в течение десяти минут, напишите в поддержку.",
      transaction: "Номер платежа: {id}",
      signIn: "Чтобы проверить оплату, войдите заново.",
      backToPricing: "К тарифам",
    },
```

В `uz.ts`:

```ts
    pay: {
      title: "To‘lov",
      waiting: "To‘lovni tekshiryapmiz…",
      success: "To‘landi. MyTamga ilovasini ochingiz — tarif allaqachon ulangan.",
      timeout:
        "To‘lov qayta ishlanmoqda. Agar tarif o‘n daqiqa ichida paydo bo‘lmasa, qo‘llab-quvvatlashga yozing.",
      transaction: "To‘lov raqami: {id}",
      signIn: "To‘lovni tekshirish uchun qaytadan kiring.",
      backToPricing: "Tariflarga",
    },
```

В `en.ts`:

```ts
    pay: {
      title: "Payment",
      waiting: "Checking the payment…",
      success: "Paid. Open the MyTamga app — the plan is already active.",
      timeout:
        "The payment is being processed. If the plan does not appear within ten minutes, write to support.",
      transaction: "Payment number: {id}",
      signIn: "Sign in again to check the payment.",
      backToPricing: "Back to pricing",
    },
```

В `zh.ts`:

```ts
    pay: {
      title: "付款",
      waiting: "正在核对付款…",
      success: "已付款。打开 MyTamga 应用，套餐已生效。",
      timeout: "付款正在处理中。如果十分钟内套餐仍未出现，请联系客服。",
      transaction: "付款编号：{id}",
      signIn: "请重新登录以核对付款。",
      backToPricing: "返回价格页",
    },
```

Замечание по узбекскому: `ochingiz` — черновик, носитель, скорее всего, скажет
`ochib ko‘ring`. Помечено `REVIEW(translation)` в заголовке файла.

- [ ] **Step 5: Создать опросчик**

Создать `components/pay/return-poller.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

import { getJson } from "@/lib/api/client";
import {
  POLL_DEADLINE_MS,
  POLL_INTERVAL_MS,
  pollOutcome,
  type PollOutcome,
} from "@/lib/billing/poll";
import type { SubscriptionView } from "@/lib/billing/subscription";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";
import { fill } from "@/lib/i18n/interpolate";

interface ReturnPollerProps {
  strings: Dictionary["billing"];
  transactionId: string | null;
  expectedPlanKey: string | null;
}

export function ReturnPoller({
  strings,
  transactionId,
  expectedPlanKey,
}: ReturnPollerProps) {
  const [outcome, setOutcome] = useState<PollOutcome>("pending");

  useEffect(() => {
    const startedAt = Date.now();
    let timer: number | undefined;
    let stopped = false;

    async function tick() {
      const result = await getJson<{ subscription: SubscriptionView }>("/api/subscription");
      const elapsedMs = Date.now() - startedAt;

      const next = pollOutcome({
        subscription: result.ok ? result.subscription : null,
        code: result.ok ? null : result.code,
        elapsedMs,
        expectedPlanKey,
      });

      if (stopped) {
        return;
      }

      setOutcome(next);

      if (next === "pending") {
        timer = window.setTimeout(() => void tick(), POLL_INTERVAL_MS);
      }
    }

    void tick();

    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [expectedPlanKey]);

  const message =
    outcome === "success"
      ? strings.pay.success
      : outcome === "signedOut"
        ? strings.pay.signIn
        : outcome === "timeout"
          ? strings.pay.timeout
          : strings.pay.waiting;

  return (
    <div className="mt-8 flex flex-col gap-3">
      <p
        aria-live="polite"
        data-pay-outcome={outcome}
        className="text-sm leading-6 text-[var(--ink)]"
      >
        {message}
      </p>

      {/* Номер платежа нужен, только когда что-то пошло не по плану: с ним
          поддержка найдёт платёж, не переспрашивая. */}
      {transactionId && outcome !== "success" && (
        <p className="text-xs leading-5 text-ink-faint [font-variant-numeric:tabular-nums]">
          {fill(strings.pay.transaction, { id: transactionId })}
        </p>
      )}
    </div>
  );
}
```

Опрос ждёт `POLL_DEADLINE_MS` только потому, что `pollOutcome` так решает:
компонент сам временем не распоряжается, и поэтому его поведение проверено
тестом, а не наблюдением.

- [ ] **Step 6: Создать страницу возврата**

Создать `app/[lang]/pay/return/page.tsx`:

```tsx
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { ReturnPoller } from "@/components/pay/return-poller";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { COOKIE } from "@/lib/api/cookies";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

// Страница личная: она читает куки и ничего не значит для поисковика.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PayReturnPage({
  params,
}: PageProps<"/[lang]/pay/return">) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const t = getDictionary(lang);
  const jar = await cookies();
  const transactionId = jar.get(COOKIE.transaction)?.value ?? null;

  return (
    <>
      <main>
        <section
          className="section-anchor w-full px-[var(--gutter)] pb-24 pt-36 lg:pb-36 lg:pt-44"
          aria-labelledby="pay-title"
        >
          <SectionHeading
            id="pay-title"
            kicker={t.billing.kicker}
            title={t.billing.pay.title}
          />

          <ReturnPoller
            strings={t.billing}
            transactionId={transactionId}
            // Куку платежа мог съесть час или другое устройство: тогда успехом
            // считается любой платный активный тариф.
            expectedPlanKey={transactionId ? "pro" : null}
          />

          <a href={`/${lang}/pricing`} className="nav-link mt-10 inline-block text-sm">
            {t.billing.pay.backToPricing}
          </a>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
```

- [ ] **Step 7: Проверить вручную**

Run: открыть `http://localhost:3000/pay/return` без входа.
Expected: адрес уводит на `/ru/pay/return` (или язык из куки); текст «Чтобы проверить оплату, войдите заново» появляется **сразу**, а не через минуту; номера платежа нет.

- [ ] **Step 8: Проверить**

Run: `npm test && npm run typecheck && npm run lint`
Expected: PASS, восемь новых тестов.

- [ ] **Step 9: Коммит**

```bash
git add lib/billing/poll.ts components/pay app/[lang]/pay lib/i18n/dictionaries tests/poll.test.ts
git commit -m "feat: payment return page that asks the server, not the URL"
```

---

## Task 16: Юридические страницы

**Files:**
- Create: `lib/legal/company.ts`
- Create: `lib/legal/documents.ts`
- Create: `components/legal/legal-document.tsx`
- Create: `app/[lang]/offer/page.tsx`, `app/[lang]/privacy/page.tsx`, `app/[lang]/terms/page.tsx`, `app/[lang]/support/page.tsx`
- Create: `scripts/check-legal.mjs`
- Modify: `lib/i18n/dictionaries/{ru,uz,en,zh}.ts` (раздел `billing.legal`), `package.json`
- Test: `tests/company.test.ts`, `tests/documents.test.ts`

**Interfaces:**
- Consumes: `Locale` (`lib/i18n/config`), `Dictionary["billing"]["legal"]`.
- Produces: `COMPANY`, `missingCompanyFields(): string[]`, типы `LegalBlock`, `LegalDocument`, `DOCUMENTS: Partial<Record<Locale, Record<LegalSlug, LegalDocument>>>`, `LegalSlug = "offer" | "privacy" | "terms"`.

**Найдено при составлении плана, и это меняет задачу к лучшему.** Политика
конфиденциальности и условия использования **уже написаны** и лежат в
монорепозитории приложения: `apps/api/public/legal/privacy/index.html` (обновлена
26.09.2026) и `.../terms/index.html` (21.08.2026). Их видит человек в
приложении. Сайт обязан показывать **тот же текст**, а не пересказ: два разных
документа под одним названием — это хуже отсутствия одного из них.

Поэтому политика и условия переносятся дословно, а заново пишется только то,
чего нет нигде: **оферта**, которую требует Click. В текстах уже есть настоящий
адрес поддержки `support@mytamga.uz` — это не заглушка.

Отклонение от спеки, которое надо назвать: спека обещала юридические тексты на
русском **и узбекском**. Узбекского перевода нет ни в приложении, ни у юриста.
Переводить черновик, который юрист всё равно перепишет, — работа впустую,
поэтому механизм языков делается сразу, а узбекский текст добавляется вместе с
проверенным русским. До тех пор `uz`, `en` и `zh` показывают уведомление, что
договор заключается на русском, со ссылкой на русскую версию.

- [ ] **Step 1: Написать падающие тесты**

Создать `tests/company.test.ts`:

```ts
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
```

Создать `tests/documents.test.ts`:

```ts
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
```

- [ ] **Step 2: Убедиться, что тесты падают**

Run: `npm test`
Expected: FAIL — `Cannot find module '../lib/legal/company.ts'`

- [ ] **Step 3: Создать реквизиты**

Создать `lib/legal/company.ts`:

```ts
/**
 * Реквизиты компании. `null` — значения ещё нет, и это видно программно:
 * проверка перед запуском не должна зависеть от того, что кто-то перечитал файл.
 *
 * Их требует Click при подключении мерчанта: он проверяет сайт и ждёт оферту,
 * цены, реквизиты и контакты.
 */
export const COMPANY = {
  /** REVIEW(legal): название юридического лица — ждём от владельца. */
  legalName: null as string | null,
  /** REVIEW(legal): ИНН. */
  taxId: null as string | null,
  /** REVIEW(legal): юридический адрес. */
  address: null as string | null,
  /** REVIEW(legal): телефон для договора и для Click. */
  phone: null as string | null,
  /** Настоящий: он указан в политике и условиях приложения. */
  supportEmail: "support@mytamga.uz",
} as const;

const REQUIRED = ["legalName", "taxId", "address", "phone"] as const;

/** Имена незаполненных полей. Пустой список — реквизиты готовы. */
export function missingCompanyFields(): string[] {
  return REQUIRED.filter((field) => !COMPANY[field]);
}
```

- [ ] **Step 4: Создать документы**

Создать `lib/legal/documents.ts`. Политика и условия — дословно из
`apps/api/public/legal/*/index.html`; оферта — черновик.

```ts
import type { Locale } from "../i18n/config.ts";

export type LegalBlock =
  | { kind: "p"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "ul"; items: string[] };

export type LegalDocument = {
  title: string;
  /** ISO-дата обновления, как в документе. */
  updated: string;
  /** Черновик — текст ещё не видел юрист, и страница об этом говорит. */
  isDraft: boolean;
  blocks: LegalBlock[];
};

export type LegalSlug = "offer" | "privacy" | "terms";

// Политика и условия перенесены дословно из монорепозитория приложения:
// apps/api/public/legal/privacy/index.html и .../terms/index.html. Если текст
// там изменится, `npm run check:legal` скажет о расхождении.
//
// REVIEW(legal): оферта — черновик. Её требует Click для подключения мерчанта,
// и до подключения её должен прочитать юрист.
//
// REVIEW(translation): узбекского, английского и китайского текстов здесь
// намеренно нет: договор заключается на русском, остальные языки ведут на него.
const ru: Record<LegalSlug, LegalDocument> = {
  privacy: {
    title: "Политика конфиденциальности MyTamga",
    updated: "2026-09-26",
    isDraft: false,
    blocks: [
      {
        kind: "p",
        text: "MyTamga обрабатывает данные учётной записи, организаций, таможенных дел, сообщений и документов только для предоставления функций сервиса, защиты доступа и исполнения обязательств пользователя.",
      },
      { kind: "h2", text: "Какие данные обрабатываются" },
      {
        kind: "p",
        text: "Контактные данные (номер телефона, адрес электронной почты), имя, сведения профиля и организации, данные сессий и устройств, документы и сообщения по делам, история расчётов, платёжные идентификаторы, а также технические журналы безопасности. Полные реквизиты банковских карт MyTamga не хранит.",
      },
      { kind: "h2", text: "Цели и хранение" },
      {
        kind: "p",
        text: "Данные используются для входа, совместной работы по делам, таможенных расчётов, уведомлений, поддержки, предотвращения злоупотреблений и выполнения требований законодательства. Срок хранения ограничивается назначением данных и применимыми обязательными сроками.",
      },
      { kind: "h2", text: "Обработка с помощью искусственного интеллекта" },
      {
        kind: "p",
        text: "Часть функций использует сторонний сервис искусственного интеллекта — OpenAI (OpenAI, L.L.C., США) или Google Gemini (Google LLC, США); какой из них подключён, приложение показывает при запросе согласия. Сервису передаются только данные, нужные для конкретной операции:",
      },
      {
        kind: "ul",
        items: [
          "содержимое загруженных документов по делу (инвойсы, контракты и другие) — чтобы распознать реквизиты и сведения о товаре;",
          "описание товара и данные дела — чтобы подобрать код ТН ВЭД, объяснить расчёт и подготовить черновик сообщения клиенту.",
        ],
      },
      {
        kind: "p",
        text: "Данные передаются только с вашего явного согласия. Приложение спрашивает его до первой передачи. Если в деле участвуют несколько человек, нужно согласие и того, кто запускает операцию, и владельца дела. Без согласия эти функции работают без стороннего сервиса. Согласие можно отозвать в любой момент в профиле; при смене сервиса искусственного интеллекта оно запрашивается заново.",
      },
      { kind: "h2", text: "Кому ещё передаются данные" },
      { kind: "p", text: "Только подключённым поставщикам и только в необходимом объёме:" },
      {
        kind: "ul",
        items: [
          "вход — Apple (Sign in with Apple) и Google, если вы входите через них; SMS-провайдер для кодов подтверждения;",
          "оплата — Click при оплате на сайте; Apple (App Store) и Google (Google Play) при покупке в приложении, а также RevenueCat, который проверяет такие покупки. Мы получаем от них статус оплаты, но не реквизиты карты;",
          "инфраструктура — хостинг сервера и хранилище документов.",
        ],
      },
      {
        kind: "p",
        text: "Применяются разграничение доступа, шифрование канала связи, журналирование действий и отзыв сессий.",
      },
      { kind: "h2", text: "Удаление аккаунта" },
      {
        kind: "p",
        text: "Аккаунт можно удалить прямо в приложении: Профиль → «Удалить аккаунт». Вместе с ним удаляются профиль, входы с устройств, уведомления, история расчётов, а также организация, где вы были единственным участником, с её делами и файлами документов. Записи журналов, которые мы обязаны хранить, сохраняются в обезличенном виде. Подписку, оформленную через App Store или Google Play, удаление аккаунта не отменяет — её нужно отменить в настройках магазина.",
      },
      { kind: "h2", text: "Права пользователя" },
      {
        kind: "p",
        text: "Для запроса доступа, исправления или удаления данных напишите на support@mytamga.uz. Обязательные по закону данные могут сохраняться до окончания установленного срока.",
      },
    ],
  },
  terms: {
    title: "Условия использования TAMGA",
    updated: "2026-08-21",
    isDraft: false,
    blocks: [
      {
        kind: "p",
        text: "Используя TAMGA, пользователь подтверждает право действовать от имени указанной организации и обязуется предоставлять достоверные данные, сохранять конфиденциальность доступа и соблюдать законодательство Республики Узбекистан.",
      },
      { kind: "h2", text: "Назначение сервиса" },
      {
        kind: "p",
        text: "TAMGA помогает вести таможенные дела, обмениваться документами и сообщениями, выполнять предварительные расчёты и получать справочную информацию. Результаты сервиса не заменяют официальное решение таможенного органа или персональную юридическую консультацию.",
      },
      { kind: "h2", text: "Платные функции" },
      {
        kind: "p",
        text: "Стоимость и состав тарифа показываются до оплаты. Платёж обрабатывает выбранная платёжная организация. Возвраты и спорные операции рассматриваются по обращению с учётом фактически оказанных услуг и обязательных правил платёжной системы.",
      },
      { kind: "h2", text: "Ответственность" },
      {
        kind: "p",
        text: "Пользователь отвечает за загружаемые материалы и принятые на их основе решения. TAMGA принимает разумные меры доступности и защиты, но не отвечает за перебои внешних государственных, банковских и телекоммуникационных систем.",
      },
      { kind: "h2", text: "Связь" },
      { kind: "p", text: "Вопросы по условиям: support@mytamga.uz." },
    ],
  },
  offer: {
    title: "Публичная оферта на подписку MyTamga",
    updated: "2026-09-26",
    isDraft: true,
    blocks: [
      { kind: "h2", text: "Предмет" },
      {
        kind: "p",
        text: "Настоящая оферта предлагает заключить договор о предоставлении доступа к функциям сервиса MyTamga по выбранному тарифу. Договор считается заключённым с момента оплаты.",
      },
      { kind: "h2", text: "Тарифы и цена" },
      {
        kind: "p",
        text: "Состав тарифов, их ограничения и стоимость указаны на странице тарифов сервиса и показываются до оплаты. Цена выражена в сумах. Оплата одного периода не продлевается автоматически, если на странице тарифа не указано иное.",
      },
      { kind: "h2", text: "Порядок оплаты" },
      {
        kind: "p",
        text: "Оплата производится через платёжную организацию, выбранную на странице оформления. Доступ по тарифу открывается после подтверждения оплаты платёжной организацией. Доступ действует в сервисе на всех устройствах пользователя.",
      },
      { kind: "h2", text: "Срок и прекращение" },
      {
        kind: "p",
        text: "Доступ по тарифу действует в течение оплаченного периода. По его окончании сервис возвращается к бесплатному тарифу без дополнительных списаний.",
      },
      { kind: "h2", text: "Возврат" },
      {
        kind: "p",
        text: "Обращение о возврате направляется на support@mytamga.uz. Возврат рассматривается с учётом фактически оказанных услуг за оплаченный период и обязательных правил платёжной системы.",
      },
      { kind: "h2", text: "Реквизиты и контакты" },
      {
        kind: "p",
        text: "Реквизиты исполнителя указаны в разделе реквизитов на этой странице. Вопросы по договору: support@mytamga.uz.",
      },
    ],
  },
};

export const DOCUMENTS: Partial<Record<Locale, Record<LegalSlug, LegalDocument>>> = {
  ru,
};
```

- [ ] **Step 5: Добавить строки `billing.legal` в четыре словаря**

В `ru.ts`, внутрь `billing`, после `pay`:

```ts
    legal: {
      offer: "Публичная оферта",
      privacy: "Политика конфиденциальности",
      terms: "Условия использования",
      support: "Поддержка",
      updated: "Дата обновления: {date}",
      draftNotice:
        "Проект документа. Он ещё не проверен юристом и не вступил в силу.",
      contractLanguage:
        "Договор заключается на русском языке. Откройте русскую версию документа.",
      detailsMissing:
        "Реквизиты исполнителя будут опубликованы до начала приёма платежей.",
      detailsTitle: "Реквизиты",
      supportTitle: "Поддержка",
      supportBody: "Напишите нам — отвечаем по рабочим дням.",
      openRussian: "Открыть на русском",
    },
```

В `uz.ts`:

```ts
    legal: {
      offer: "Ommaviy oferta",
      privacy: "Maxfiylik siyosati",
      terms: "Foydalanish shartlari",
      support: "Qo‘llab-quvvatlash",
      updated: "Yangilangan sana: {date}",
      draftNotice: "Hujjat loyihasi. U hali yurist tomonidan tekshirilmagan va kuchga kirmagan.",
      contractLanguage:
        "Shartnoma rus tilida tuziladi. Hujjatning rus tilidagi versiyasini oching.",
      detailsMissing:
        "Ijrochining rekvizitlari to‘lovlar qabul qilinishidan oldin e’lon qilinadi.",
      detailsTitle: "Rekvizitlar",
      supportTitle: "Qo‘llab-quvvatlash",
      supportBody: "Bizga yozing — ish kunlari javob beramiz.",
      openRussian: "Rus tilida ochish",
    },
```

В `en.ts`:

```ts
    legal: {
      offer: "Public offer",
      privacy: "Privacy policy",
      terms: "Terms of use",
      support: "Support",
      updated: "Updated: {date}",
      draftNotice: "A draft. It has not been reviewed by a lawyer and is not in force.",
      contractLanguage:
        "The contract is concluded in Russian. Please open the Russian version of the document.",
      detailsMissing: "The provider's registration details will be published before payments open.",
      detailsTitle: "Registration details",
      supportTitle: "Support",
      supportBody: "Write to us — we reply on working days.",
      openRussian: "Open in Russian",
    },
```

В `zh.ts`:

```ts
    legal: {
      offer: "公开要约",
      privacy: "隐私政策",
      terms: "使用条款",
      support: "客户支持",
      updated: "更新日期：{date}",
      draftNotice: "文件草案，尚未经律师审核，未生效。",
      contractLanguage: "合同以俄语订立，请查看文件的俄语版本。",
      detailsMissing: "开通付款前将公布服务提供方的工商登记信息。",
      detailsTitle: "工商登记信息",
      supportTitle: "客户支持",
      supportBody: "请联系我们，我们会在工作日回复。",
      openRussian: "查看俄语版本",
    },
```

- [ ] **Step 6: Создать оболочку документа**

Создать `components/legal/legal-document.tsx`:

```tsx
import { SectionHeading } from "@/components/section-heading";
import { COMPANY, missingCompanyFields } from "@/lib/legal/company";
import { DOCUMENTS, type LegalSlug } from "@/lib/legal/documents";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";
import { fill } from "@/lib/i18n/interpolate";

interface LegalDocumentViewProps {
  slug: LegalSlug;
  locale: Locale;
  strings: Dictionary["billing"];
}

export function LegalDocumentView({ slug, locale, strings }: LegalDocumentViewProps) {
  const document = DOCUMENTS[locale]?.[slug];
  const missing = missingCompanyFields();

  return (
    <section
      className="section-anchor w-full px-[var(--gutter)] pb-24 pt-36 lg:pb-36 lg:pt-44"
      aria-labelledby="legal-title"
    >
      <SectionHeading
        id="legal-title"
        kicker={strings.legal[slug]}
        title={document?.title ?? strings.legal[slug]}
      />

      {/* Текста на этом языке нет — не делаем вид, что он есть. */}
      {!document && (
        <div data-legal="translation-missing" className="mt-10 max-w-2xl">
          <p className="text-sm leading-6 text-ink-soft">
            {strings.legal.contractLanguage}
          </p>
          <a href={`/ru/${slug}`} className="nav-link mt-4 inline-block text-sm">
            {strings.legal.openRussian}
          </a>
        </div>
      )}

      {document && (
        <>
          <p className="mt-8 text-xs text-ink-faint">
            {fill(strings.legal.updated, { date: document.updated })}
          </p>

          {document.isDraft && (
            <p
              data-legal="draft"
              className="mt-4 max-w-2xl border-l-2 border-[var(--accent)] pl-4 text-sm leading-6 text-ink-soft"
            >
              {strings.legal.draftNotice}
            </p>
          )}

          <div className="mt-10 flex max-w-2xl flex-col gap-5">
            {document.blocks.map((block, index) => {
              if (block.kind === "h2") {
                return (
                  <h2
                    key={index}
                    className="mt-5 text-base font-semibold tracking-[-0.01em] text-[var(--ink)]"
                  >
                    {block.text}
                  </h2>
                );
              }

              if (block.kind === "ul") {
                return (
                  <ul key={index} className="flex list-disc flex-col gap-2 pl-5">
                    {block.items.map((item) => (
                      <li key={item} className="text-sm leading-6 text-ink-soft">
                        {item}
                      </li>
                    ))}
                  </ul>
                );
              }

              return (
                <p key={index} className="text-sm leading-6 text-ink-soft">
                  {block.text}
                </p>
              );
            })}
          </div>

          {/* Реквизиты требует Click. Пока их нет, страница говорит об этом
              прямо, а не оставляет пустой раздел. */}
          <div className="mt-12 max-w-2xl border-t border-line-soft pt-8">
            <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--ink)]">
              {strings.legal.detailsTitle}
            </h2>
            {missing.length > 0 ? (
              <p data-legal="details-missing" className="mt-3 text-sm leading-6 text-ink-soft">
                {strings.legal.detailsMissing}
              </p>
            ) : (
              <dl className="mt-3 flex flex-col gap-1 text-sm leading-6 text-ink-soft">
                <div>{COMPANY.legalName}</div>
                <div>{COMPANY.taxId}</div>
                <div>{COMPANY.address}</div>
                <div>{COMPANY.phone}</div>
              </dl>
            )}
            <p className="mt-3 text-sm leading-6 text-ink-soft">
              <a href={`mailto:${COMPANY.supportEmail}`} className="nav-link">
                {COMPANY.supportEmail}
              </a>
            </p>
          </div>
        </>
      )}
    </section>
  );
}
```

- [ ] **Step 7: Создать четыре страницы**

Создать `app/[lang]/offer/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LegalDocumentView } from "@/components/legal/legal-document";
import { SiteFooter } from "@/components/site-footer";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/offer">): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? { title: getDictionary(lang).billing.legal.offer } : {};
}

export default async function OfferPage({ params }: PageProps<"/[lang]/offer">) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  return (
    <>
      <main>
        <LegalDocumentView slug="offer" locale={lang} strings={getDictionary(lang).billing} />
      </main>
      <SiteFooter />
    </>
  );
}
```

Создать `app/[lang]/privacy/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LegalDocumentView } from "@/components/legal/legal-document";
import { SiteFooter } from "@/components/site-footer";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/privacy">): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? { title: getDictionary(lang).billing.legal.privacy } : {};
}

export default async function PrivacyPage({ params }: PageProps<"/[lang]/privacy">) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  return (
    <>
      <main>
        <LegalDocumentView slug="privacy" locale={lang} strings={getDictionary(lang).billing} />
      </main>
      <SiteFooter />
    </>
  );
}
```

Создать `app/[lang]/terms/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LegalDocumentView } from "@/components/legal/legal-document";
import { SiteFooter } from "@/components/site-footer";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/terms">): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? { title: getDictionary(lang).billing.legal.terms } : {};
}

export default async function TermsPage({ params }: PageProps<"/[lang]/terms">) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  return (
    <>
      <main>
        <LegalDocumentView slug="terms" locale={lang} strings={getDictionary(lang).billing} />
      </main>
      <SiteFooter />
    </>
  );
}
```

Создать `app/[lang]/support/page.tsx` — отдельная страница, без документа:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { COMPANY } from "@/lib/legal/company";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/support">): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? { title: getDictionary(lang).billing.legal.support } : {};
}

export default async function SupportPage({ params }: PageProps<"/[lang]/support">) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const t = getDictionary(lang);

  return (
    <>
      <main>
        <section
          className="section-anchor w-full px-[var(--gutter)] pb-24 pt-36 lg:pb-36 lg:pt-44"
          aria-labelledby="support-title"
        >
          <SectionHeading
            id="support-title"
            kicker={t.billing.legal.support}
            title={t.billing.legal.supportTitle}
          />
          <p className="mt-8 max-w-xl text-sm leading-6 text-ink-soft">
            {t.billing.legal.supportBody}
          </p>
          <p className="mt-4 text-sm leading-6">
            <a href={`mailto:${COMPANY.supportEmail}`} className="nav-link">
              {COMPANY.supportEmail}
            </a>
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
```

- [ ] **Step 8: Создать проверку юридических страниц**

Создать `scripts/check-legal.mjs`:

```js
// Что осталось сделать до подключения мерчанта и до первых денег.
// Запуск: npm run check:legal
//
// Проверяет две вещи:
//   1. какие реквизиты ещё не заполнены;
//   2. не разошёлся ли наш текст политики и условий с текстом в приложении —
//      если репозиторий приложения лежит рядом. Два разных документа под одним
//      названием хуже отсутствия одного из них.

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const APP_REPO = process.env.MYTAMGA_REPO ?? resolve(import.meta.dirname, "../../MyTamga");

const problems = [];

const company = readFileSync(resolve(import.meta.dirname, "../lib/legal/company.ts"), "utf8");

for (const field of ["legalName", "taxId", "address", "phone"]) {
  if (new RegExp(`${field}: null`).test(company)) {
    problems.push(`реквизит не заполнен: ${field}`);
  }
}

const documents = readFileSync(
  resolve(import.meta.dirname, "../lib/legal/documents.ts"),
  "utf8",
);

if (/isDraft: true/.test(documents)) {
  problems.push("есть документ со статусом черновика — его должен прочитать юрист");
}

const SOURCES = {
  privacy: "apps/api/public/legal/privacy/index.html",
  terms: "apps/api/public/legal/terms/index.html",
};

if (existsSync(APP_REPO)) {
  for (const [slug, relative] of Object.entries(SOURCES)) {
    const path = resolve(APP_REPO, relative);

    if (!existsSync(path)) {
      problems.push(`в приложении нет ${relative} — проверьте, не переехал ли текст`);
      continue;
    }

    const html = readFileSync(path, "utf8");
    // Сравниваем по абзацам: разметка и пробелы нас не интересуют.
    const paragraphs = [...html.matchAll(/<(?:p|li)>(.*?)<\/(?:p|li)>/gs)].map((match) =>
      match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
    );

    const missing = paragraphs.filter(
      (text) => text.length > 40 && !documents.includes(text),
    );

    if (missing.length > 0) {
      problems.push(
        `${slug}: текст разошёлся с приложением, ${missing.length} абзац(ев) отсутствует`,
      );
      for (const text of missing.slice(0, 3)) {
        problems.push(`  · ${text.slice(0, 90)}…`);
      }
    }
  }
} else {
  problems.push(
    `репозиторий приложения не найден (${APP_REPO}) — сверку политики и условий пропустили`,
  );
}

if (problems.length === 0) {
  console.log("Юридические страницы готовы.");
  process.exit(0);
}

console.log("Юридические страницы — осталось закрыть:");
for (const problem of problems) {
  console.log(` - ${problem}`);
}
// Это список дел, а не поломка сборки: заглушки живут до ответа владельца.
process.exit(0);
```

Добавить в `package.json`, в `scripts`:

```json
    "check:legal": "node scripts/check-legal.mjs"
```

- [ ] **Step 9: Проверить сверку**

Run: `npm run check:legal`
Expected: список из четырёх незаполненных реквизитов, строки про черновик оферты, и **ни одной** строки про расхождение текста с приложением.

- [ ] **Step 10: Проверить страницы**

Run: открыть `/ru/privacy`, `/ru/terms`, `/ru/offer`, `/ru/support`, затем `/en/privacy`.
Expected: русские документы читаются целиком; на оферте есть пометка о черновике; раздел реквизитов говорит, что они будут опубликованы; `/en/privacy` показывает уведомление о языке договора и ссылку на русскую версию.

- [ ] **Step 11: Проверить**

Run: `npm test && npm run typecheck && npm run lint`
Expected: PASS, девять новых тестов.

- [ ] **Step 12: Коммит**

```bash
git add lib/legal components/legal app/[lang]/offer app/[lang]/privacy app/[lang]/terms app/[lang]/support scripts/check-legal.mjs package.json lib/i18n/dictionaries tests/company.test.ts tests/documents.test.ts
git commit -m "feat: legal pages carrying the app's own texts"
```

---

## Task 17: Навигация и подвал

**Files:**
- Modify: `components/site-header.tsx`
- Modify: `components/site-footer.tsx`

**Interfaces:**
- Consumes: `Dictionary["billing"]["nav"]`, `Dictionary["billing"]["legal"]`.
- Produces: `HeaderStrings` получает поле `pricingLabel: string`.

До сих пор все ссылки шапки были внутристраничными якорями: сайт состоял из
одной страницы. Теперь их четыре, и якорь `#services` со страницы тарифов ведёт
в никуда. Ссылки становятся абсолютными — `/{lang}#services` — и работают
откуда угодно, а на главной по-прежнему плавно прокручивают: переход на тот же
адрес с хешем браузер обрабатывает как прокрутку.

- [ ] **Step 1: Сделать ссылки шапки абсолютными и добавить тарифы**

В `components/site-header.tsx` в типе `HeaderStrings` добавить:

```tsx
  pricingLabel: string;
```

и заменить `navItems`:

```tsx
  // Абсолютные адреса, а не якоря: со страницы тарифов «#services» ведёт в
  // никуда. На главной браузер всё так же плавно прокручивает.
  const navItems = [
    { title: nav.home, href: `/${locale}#hero` },
    { title: nav.services, href: `/${locale}#services` },
    { title: strings.pricingLabel, href: `/${locale}/pricing` },
    { title: nav.calc, href: `/${locale}#calc` },
    { title: nav.about, href: `/${locale}#about` },
    { title: nav.contacts, href: `/${locale}#contacts` },
  ];
```

Там же заменить `href="#hero"` у логотипа на `href={`/${locale}#hero`}`.

- [ ] **Step 2: Передать подпись в шапку**

В `app/[lang]/layout.tsx` заменить вызов:

```tsx
        <SiteHeader
          locale={lang}
          strings={{
            nav: t.nav,
            themeLabel: t.theme.light,
            pricingLabel: t.billing.nav,
          }}
        />
```

- [ ] **Step 3: Добавить юридические ссылки в подвал**

В `components/site-footer.tsx` заменить массив `links` и добавить второй ряд:

```tsx
  const { locale } = await getCurrentDictionary();

  const links = [
    { title: t.nav.home, href: `/${locale}#hero` },
    { title: t.nav.services, href: `/${locale}#services` },
    { title: t.billing.nav, href: `/${locale}/pricing` },
    { title: t.nav.calc, href: `/${locale}#calc` },
    { title: t.nav.about, href: `/${locale}#about` },
    { title: t.nav.contacts, href: `/${locale}#contacts` },
  ];

  // Оферта, политика и условия обязаны быть доступны с любой страницы: их
  // проверяет Click при подключении мерчанта, а на политику и условия
  // ссылается конфигурация приложения.
  const legalLinks = [
    { title: t.billing.legal.offer, href: `/${locale}/offer` },
    { title: t.billing.legal.privacy, href: `/${locale}/privacy` },
    { title: t.billing.legal.terms, href: `/${locale}/terms` },
    { title: t.billing.legal.support, href: `/${locale}/support` },
  ];
```

и перед строкой с копирайтом:

```tsx
      <nav aria-label={t.billing.legal.offer} className="mt-10">
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {legalLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="nav-link text-xs">
                {link.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
```

`getCurrentDictionary()` уже возвращает `locale` — второго чтения не нужно.

- [ ] **Step 4: Проверить переходы**

Run: открыть `/ru`, перейти по «Тарифы», оттуда по «Услуги».
Expected: с главной «Услуги» плавно прокручивает; со страницы тарифов та же ссылка возвращает на главную к разделу услуг; язык при переходах сохраняется; в подвале четыре юридические ссылки на всех страницах.

- [ ] **Step 5: Проверить**

Run: `npm test && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 6: Коммит**

```bash
git add components/site-header.tsx components/site-footer.tsx app/[lang]/layout.tsx
git commit -m "feat: site-wide links to pricing and the legal pages"
```

---

## Task 18: Сверка цен с каталогом

**Files:**
- Create: `scripts/check-catalog.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: запущенный сайт и API приложения; `FEATURE_LABELS`, `LIMIT_LABELS` (задача 11).
- Produces: `npm run check:catalog`.

Спека требует сверять цены с каталогом **сверкой, а не глазами**.

Отклонение от спеки, которое надо назвать. Спека обещала харнесс Playwright в
scratchpad — `pricing.mjs`, `checkout.mjs`, `pay-return.mjs`, `errors.mjs`,
`legal.mjs` — как в предыдущих подпроектах. Но `playwright-core` в зависимостях
репозитория нет, а добавлять зависимости запрещено тем же документом; временный
харнесс к тому же не переживает сессию, и следующий исполнитель его не получит.
Поэтому обязательная проверка — вот этот скрипт: он коммитится, ничего не тянет
и сверяет цены на настоящей отданной странице. Браузерные проверки остались
ручными шагами внутри задач 12–17.

Если `playwright-core` в окружении всё же доступен (как в предыдущих
подпроектах), стоит дополнительно прогнать прежние `console-clean`, `contrast`,
`glyphs`, `snapshot` и `regress` по новым маршрутам — но ни один шаг плана от
этого не зависит.

- [ ] **Step 1: Написать скрипт**

Создать `scripts/check-catalog.mjs`:

```js
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
    .replace(/\s+/g, " ");

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
```

- [ ] **Step 2: Добавить скрипт в package.json**

```json
    "check:catalog": "node scripts/check-catalog.mjs"
```

- [ ] **Step 3: Запустить сверку**

Run: поднять сайт и API, затем `npm run check:catalog`
Expected: `Сверка пройдена: 3 тариф(ов), 4 языка, цены не объявлены и не показаны.` — VIP в публичный список не входит, поэтому тарифов там меньше четырёх.

- [ ] **Step 4: Убедиться, что сверка умеет падать**

Временно вписать в `components/pricing/plan-card.tsx` жёсткую цену — например
`<p>39 000 сум/мес</p>` — и запустить `npm run check:catalog`.
Expected: FAIL со строкой «цена 39 000 показана, хотя цены ещё не объявлены».
Убрать правку и убедиться, что сверка снова проходит. Оракул, который не умеет
падать, бесполезен.

- [ ] **Step 5: Коммит**

```bash
git add scripts/check-catalog.mjs package.json
git commit -m "test: compare rendered prices against the catalog"
```

---

## Task 19: Записать в DESIGN.md

**Files:**
- Modify: `DESIGN.md`

`DESIGN.md` — то, что читает следующий работающий здесь. Всё, на чём можно
споткнуться, должно быть записано там, а не только в плане.

- [ ] **Step 1: Добавить главу «Биллинг»**

В конец `DESIGN.md`:

```markdown
## Billing

- Prices, plan names, feature and limit labels come from `GET /api/billing/plans`
  on the application's API. Nothing is written into this repository. A stale
  price would disagree with what the provider charges, which is worse than no
  price at all.
- `lib/billing/flags.ts` holds the stage. `PRICES_PUBLISHED` is `false` until the
  owner announces prices **and** the catalogue amount matches what the provider
  charges (`CLICK_PLAN_PRO_AMOUNT_UZS` in the application repository). The flag
  lives in code, not in an environment variable, so turning the checkout on is
  visible in a diff and passes review. `tests/flags.test.ts` fails when it flips,
  on purpose.
- The browser never talks to the application's API. Route handlers under
  `app/api/` do, and they keep tokens in `HttpOnly` cookies. Page scripts —
  Spline and the shaders, both from a CDN — cannot read them.
- Cookies use `SameSite=Lax`, never `Strict`: the visitor comes back from the
  payment provider's site, a cross-site navigation, and `Strict` would drop the
  session exactly when the return page needs it.
- Feature and limit labels are translated by their stable catalogue keys in
  `lib/billing/label-maps.ts`. Russian has no map: the catalogue is Russian
  already. An unknown key falls back to the catalogue's Russian label rather
  than rendering an empty line.
- The checkout reads the subscription before showing a pay button, so "only the
  owner can pay" (403) and "bought in an app store" (409) are explained up
  front instead of arriving after the click.
- Payment providers come from `GET /api/billing/payment-providers`. Only those
  reported `online` are offered. Click is implemented on the server; Payme and
  Uzum are stubs there, and Stripe cannot work for an Uzbek entity, so it is
  absent from the interface.
- Only Uzbek phone numbers can sign in: `normalizePhone` on the server takes
  twelve digits starting with 998. The English and Chinese pages say so and
  offer the request form instead of a dead end.
```

- [ ] **Step 2: Добавить главу «Environment»**

```markdown
## Environment

`.env*` is gitignored, so the variables are documented here.

| Variable | Used by | Notes |
| --- | --- | --- |
| `MYTAMGA_API_URL` | route handlers, catalogue loading | The application's API, e.g. `http://localhost:3001` locally and `https://api.mytamga.uz` in production. Server-side only — no `NEXT_PUBLIC_` prefix, because the browser never calls the API. |
| `NEXT_PUBLIC_SITE_URL` | `generateMetadata` | Absolute base for canonical and hreflang links. |
| `MYTAMGA_REPO` | `npm run check:legal` | Path to the application's monorepo for the legal-text comparison. Defaults to `../MyTamga`. |
```

- [ ] **Step 3: Дописать ограничение развёртывания в «Known constraints»**

```markdown
- The site must run where the application's API trusts it as a proxy. The API
  derives the rate-limit key from `request.ip` and allows three sign-in requests
  a minute per address; it honours `X-Forwarded-For` only from the proxies in
  `TRUST_PROXY`, which by default covers loopback and private ranges. On the
  same machine as the API this works with no configuration. On a host with
  rotating addresses — Vercel and the like — the real client address cannot be
  forwarded, every visitor shares one counter, and the fourth person in a minute
  is refused sign-in through no fault of their own.
```

- [ ] **Step 4: Коммит**

```bash
git add DESIGN.md
git commit -m "docs: billing, environment and the deployment constraint"
```

---

## Task 20: Этап второй — включение кассы

Кода здесь нет. Это проверочный лист, который выполняется, когда владелец
объявит цены. Держится в плане, чтобы условия включения не забылись.

- [ ] **Step 1: Убедиться, что сумма совпадает**

Спросить у того, кто ведёт `apps/api`: берётся ли сумма для провайдера из
`BILLING_PLAN_CATALOG`, а не из `CLICK_PLAN_PRO_AMOUNT_UZS`. Пока нет —
**не включать**: страница покажет одну цену, спишется другая, и сайт этого
увидеть не может.

- [ ] **Step 2: Проверить тестовой оплатой**

Провести тестовую оплату у провайдера и сверить: сумма, которую показал сайт,
равна сумме, которую показал провайдер.

- [ ] **Step 3: Включить флаг**

В `lib/billing/flags.ts` поставить `PRICES_PUBLISHED = true` и обновить
`tests/flags.test.ts` — растяжка должна падать осознанно, в том же коммите, где
видно, что шаги 1 и 2 закрыты.

- [ ] **Step 4: Сверить цены**

Run: `npm run check:catalog`
Expected: `цены объявлены и совпадают`, ни одного расхождения на четырёх языках.

- [ ] **Step 5: Пройти путь оплаты целиком**

Оплатить Pro на сайте, вернуться, дождаться успеха на `/pay/return`, затем
проверить в приложении, что тем же аккаунтом виден Pro.

- [ ] **Step 6: Проверить отказы**

Отменённая оплата не включает тариф. Повторное уведомление провайдера о той же
оплате не продлевает тариф второй раз. Организации с подпиской из App Store
сайт не продаёт поверх неё.

- [ ] **Step 7: Коммит**

```bash
git add lib/billing/flags.ts tests/flags.test.ts
git commit -m "feat: open the checkout now that prices are announced"
```
