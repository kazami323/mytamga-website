# Достройка лендинга MyTamga — план реализации

> **Для агентов-исполнителей:** ОБЯЗАТЕЛЬНЫЙ СУБ-СКИЛЛ: используйте
> superpowers:subagent-driven-development (рекомендуется) или
> superpowers:executing-plans для выполнения по задачам. Шаги размечены
> чекбоксами (`- [ ]`).

**Цель:** закрыть три оставшихся пункта навигации живыми секциями, дать
посетителю способ оставить заявку и завершить страницу футером.

**Архитектура:** одна страница, секции — самостоятельные компоненты,
связь через якоря. Весь копирайт новых секций в одном типизированном
модуле `lib/content.ts`. Форма отправляется в Server Action через
`useActionState`, поэтому работает и без JS. Чистая валидация вынесена
в отдельный модуль и не знает про React.

**Стек:** Next.js 16 (App Router), React 19, Tailwind v4, framer-motion 13,
lucide-react 1. Новых зависимостей нет.

**Спека:** `docs/superpowers/specs/2026-09-02-mytamga-landing-sections-design.md`

## Глобальные ограничения

- **Новых зависимостей не добавлять.** Ни runtime, ни dev.
- **Ничего не выдумывать.** Цифры, сроки, отзывы, имена, цены, логотипы
  клиентов — запрещены. Нет данных → `TODO(copy)` и видимый текст
  «Место под текст».
- **Unbounded только для утверждения героя.** Заголовки секций — Manrope.
- **Один акцентный цвет** `#c7a7ff` через `var(--accent)`.
- **Горизонтальный отступ только через** `px-[var(--gutter)]`. Никаких
  собственных `px-*` на уровне секции.
- **Свойства раскладки — в утилитах Tailwind, не в `globals.css`.** Правила
  там грузятся после Tailwind при равной специфичности и молча перебивают
  респонсив-варианты вроде `md:hidden`.
- **`backdrop-filter` пишется префиксом вперёд**, стандартное свойство
  последним — Lightning CSS схлопывает пару и оставляет последнее.
- **`prefers-reduced-motion`** гасит смещения, содержимое остаётся видимым.
- **Комментарии и идентификаторы в коде — по-английски**, тексты интерфейса
  по-русски. Это конвенция проекта.

## Про верификацию

В проекте **нет тестового раннера**, и спека запрещает его добавлять.
Красно-зелёный цикл выполняется браузерным стендом на `playwright-core`
(уже стоит в скратчпаде сессии, в зависимости проекта не входит):

```
SCR=<скратчпад сессии>
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
cd "$SCR" && CHROME_EXE="$CHROME" node check-N.mjs
```

Каждая задача сначала получает скрипт проверки, который **обязан упасть**
до реализации, и только потом код. Скрипты живут в скратчпаде и в
репозиторий не попадают — это оснастка, а не код проекта.

Dev-сервер должен быть запущен: `npm run dev`.

Один раз создайте общий модуль стенда `$SCR/harness.mjs` — все проверки
импортируют его, поэтому каждый скрипт остаётся коротким и самодостаточным:

```js
import { chromium } from 'playwright-core';

const CHROME = process.env.CHROME_EXE;

/** Открывает страницу, ждёт сцену, отдаёт page + собранные ошибки JS. */
export async function open({ width = 1680, height = 1000, reducedMotion } = {}) {
  const browser = await chromium.launch({
    executablePath: CHROME,
    args: ['--use-gl=angle', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({
    viewport: { width, height },
    isMobile: width < 500,
    ...(reducedMotion ? { reducedMotion } : {}),
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message.split('\n')[0]));
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(9000);
  return { browser, page, errors };
}

/** Печатает итог и выходит с нужным кодом. */
export function report(fails, payload) {
  if (payload) console.log(JSON.stringify(payload));
  if (fails.length) {
    console.log('FAIL:\n' + fails.join('\n'));
    process.exit(1);
  }
  console.log('PASS');
}

/** Базовые проверки секции, общие для всех задач. */
export function checkSection(r, fails, sel) {
  if (!r.ok) { fails.push(r.why); return; }
  if (!r.labelled) fails.push(`${sel}: aria-labelledby не связан с h2`);
  if (r.scrollMargin === '0px') fails.push(`${sel}: нет scroll-margin-top`);
  if (r.hOverflow !== 0) fails.push(`${sel}: горизонтальное переполнение`);
}
```

Если позже понадобятся модульные тесты валидации — это отдельная правка
спеки и одна dev-зависимость. В этот заход не входит.

## Карта файлов

| Файл | Ответственность |
| --- | --- |
| `lib/content.ts` | Весь копирайт новых секций и заглушки |
| `lib/lead.ts` | Чистая валидация заявки, без React |
| `app/actions/submit-lead.ts` | Server Action, шов под отправку |
| `components/ui/reveal.tsx` | Проявление при входе в вьюпорт |
| `components/ui/text-field.tsx` | Поле ввода на токенах проекта |
| `components/section-heading.tsx` | Кикер + заголовок секции |
| `components/how-it-works.tsx` | Секция «Как это работает» |
| `components/calculation.tsx` | Секция «Расчёт» |
| `components/about.tsx` | Секция «О нас» |
| `components/lead-form.tsx` | Форма заявки |
| `components/contact.tsx` | Секция «Контакты» |
| `components/site-footer.tsx` | Футер |

Изменяются: `app/page.tsx`, `components/site-header.tsx`,
`app/globals.css`, `DESIGN.md`.

---

### Задача 1: Фундамент и секция «Как это работает»

Модуль копирайта, общий заголовок секции и обёртка проявления нужны
первой же секции, поэтому собираются вместе с ней.

**Файлы:**
- Создать: `lib/content.ts`
- Создать: `components/ui/reveal.tsx`
- Создать: `components/section-heading.tsx`
- Создать: `components/how-it-works.tsx`
- Изменить: `app/globals.css` (селектор кикера)
- Изменить: `app/page.tsx`

**Интерфейсы:**
- Производит: `PLACEHOLDER: string`; `howItWorks`, `calculation`, `about`,
  `contact`, `footer` — объекты из `lib/content.ts`;
  `Reveal({ children, delay?, className? })`;
  `SectionHeading({ id, kicker, title })`; `HowItWorks()`.

- [ ] **Шаг 1: Скрипт проверки**

Создать `$SCR/check-1.mjs`:

```js
import { open, checkSection, report } from './harness.mjs';

const { browser, page, errors } = await open();

const r = await page.evaluate(() => {
  const s = document.querySelector('#how');
  if (!s) return { ok: false, why: 'секции #how нет' };
  const h2 = s.querySelector('h2');
  return {
    ok: true,
    steps: s.querySelectorAll('li').length,
    padLeft: getComputedStyle(s).paddingLeft,
    gutter: getComputedStyle(document.documentElement).getPropertyValue('--gutter').trim(),
    labelled: s.getAttribute('aria-labelledby') === h2?.id,
    scrollMargin: getComputedStyle(s).scrollMarginTop,
    hOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
});

const fails = [];
checkSection(r, fails, '#how');
if (r.ok && r.steps !== 3) fails.push(`ожидалось 3 шага, получено ${r.steps}`);
if (errors.length) fails.push('ошибки JS: ' + errors.join('; '));

await browser.close();
report(fails, r);
```

- [ ] **Шаг 2: Убедиться, что проверка падает**

Запустить: `cd "$SCR" && CHROME_EXE="$CHROME" node check-1.mjs`
Ожидается: `{"ok":false,"why":"секции #how нет"}`, код выхода 1.

- [ ] **Шаг 3: Модуль копирайта**

Создать `lib/content.ts`:

```ts
// Copy for every section built after the hero. One file, so replacing the
// placeholders with the client's real wording is a single edit.
//
// TODO(copy)   — no data exists; the visible string is a placeholder.
// REVIEW(copy) — an industry fact, not a claim about the company; the
//                client still has to confirm it.

export const PLACEHOLDER = "Место под текст";

export const howItWorks = {
  kicker: "Как это работает",
  title: "Три шага до готового пакета",
  steps: [
    {
      id: "describe",
      title: "Опишите товар",
      body: "Название, состав, назначение и страна происхождения.",
    },
    {
      id: "receive",
      title: "Получите код и расчёт",
      body: "Код ТН ВЭД и таможенные платежи — до подачи декларации.",
    },
    {
      id: "collect",
      title: "Заберите документы",
      body: "Готовый пакет остаётся передать декларанту.",
    },
  ],
} as const;

export const calculation = {
  kicker: "Расчёт",
  title: "Что нужно, чтобы посчитать",
  // REVIEW(copy): standard inputs of any customs calculation, not a promise.
  inputs: [
    {
      id: "goods",
      title: "Описание товара",
      body: "Название, состав и назначение.",
    },
    {
      id: "origin",
      title: "Страна происхождения",
      body: "От неё зависят применимые ставки.",
    },
    {
      id: "value",
      title: "Таможенная стоимость",
      body: "Цена сделки и сопутствующие расходы.",
    },
    {
      id: "weight",
      title: "Вес и объём",
      body: "Брутто, нетто и габариты партии.",
    },
  ],
  resultKicker: "Что вы получаете",
  // TODO(copy): what the calculation returns is a claim about the service.
  results: [
    { id: "result-1", title: PLACEHOLDER, body: PLACEHOLDER },
    { id: "result-2", title: PLACEHOLDER, body: PLACEHOLDER },
    { id: "result-3", title: PLACEHOLDER, body: PLACEHOLDER },
  ],
  cta: "Оставить заявку",
} as const;

export const about = {
  kicker: "О нас",
  // TODO(copy): everything below needs the client's text.
  title: PLACEHOLDER,
  body: PLACEHOLDER,
  facts: [
    { id: "fact-1", label: PLACEHOLDER, value: PLACEHOLDER },
    { id: "fact-2", label: PLACEHOLDER, value: PLACEHOLDER },
    { id: "fact-3", label: PLACEHOLDER, value: PLACEHOLDER },
  ],
} as const;

type Channel = {
  id: string;
  label: string;
  value: string;
  href: string | null;
};

export const contact: {
  kicker: string;
  title: string;
  body: string;
  channels: Channel[];
} = {
  kicker: "Контакты",
  title: "Расскажите о товаре",
  body: "Опишите, что везёте. Ответим с кодом ТН ВЭД и расчётом платежей.",
  // TODO(copy): real channels. `href` stays null until a value exists —
  // a link to a placeholder is worse than no link.
  channels: [
    { id: "phone", label: "Телефон", value: PLACEHOLDER, href: null },
    { id: "email", label: "Почта", value: PLACEHOLDER, href: null },
    { id: "place", label: "Адрес", value: PLACEHOLDER, href: null },
  ],
};

export const footer = {
  // TODO(copy): legal entity, registration number, address.
  legal: PLACEHOLDER,
} as const;
```

- [ ] **Шаг 4: Обёртка проявления**

Создать `components/ui/reveal.tsx`:

```tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/**
 * One client boundary for the whole page's reveal, so sections themselves
 * stay server components. Reduced motion keeps the fade and drops the travel.
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Шаг 5: Общий заголовок секции**

Создать `components/section-heading.tsx`:

```tsx
interface SectionHeadingProps {
  id: string;
  kicker: string;
  title: string;
}

export function SectionHeading({ id, kicker, title }: SectionHeadingProps) {
  return (
    <>
      <p className="section-kicker mb-7 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/45 sm:text-xs">
        {kicker}
      </p>
      <h2
        id={id}
        className="max-w-3xl text-[clamp(1.6rem,4.5vw,2.1rem)] font-semibold leading-[1.12] tracking-[-0.035em] text-[var(--ink)] lg:text-[clamp(2rem,2.6vw,3rem)]"
      >
        {title}
      </h2>
    </>
  );
}
```

- [ ] **Шаг 6: Кикер секции в CSS**

В `app/globals.css` расширить существующие селекторы кикера, **не
переименовывая** `.hero-kicker` — на него завязан герой:

Найти `.hero-kicker {` → заменить на `.hero-kicker,\n.section-kicker {`
Найти `.hero-kicker::before {` → заменить на
`.hero-kicker::before,\n.section-kicker::before {`

- [ ] **Шаг 7: Секция**

Создать `components/how-it-works.tsx`:

```tsx
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/section-heading";
import { howItWorks } from "@/lib/content";

export function HowItWorks() {
  return (
    <section
      id="how"
      className="section-anchor w-full px-[var(--gutter)] py-24 lg:py-36"
      aria-labelledby="how-title"
    >
      <SectionHeading
        id="how-title"
        kicker={howItWorks.kicker}
        title={howItWorks.title}
      />

      <ol className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-6">
        {howItWorks.steps.map((step, index) => (
          <li key={step.id}>
            <Reveal delay={index * 0.08}>
              <p
                className="text-sm font-semibold tracking-[0.08em] text-[var(--accent)]"
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-5 text-base font-semibold tracking-[-0.01em] text-[var(--ink)]">
                {step.title}
              </h3>
              <p className="mt-3 max-w-xs text-sm leading-6 text-white/50">
                {step.body}
              </p>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
```

- [ ] **Шаг 8: Подключить на страницу**

В `app/page.tsx` добавить импорт `import { HowItWorks } from "@/components/how-it-works";`
и вставить `<HowItWorks />` **после** `<Capabilities />`.

- [ ] **Шаг 9: Убедиться, что проверка проходит**

Запустить: `cd "$SCR" && CHROME_EXE="$CHROME" node check-1.mjs`
Ожидается: `PASS`, код выхода 0.

Затем: `npm run typecheck && npm run lint` — обе чисто.

- [ ] **Шаг 10: Коммит**

```bash
git add lib/content.ts components/ui/reveal.tsx components/section-heading.tsx components/how-it-works.tsx app/globals.css app/page.tsx
git commit -m "feat: content module, reveal wrapper and the how-it-works section"
```

---

### Задача 2: Секция «Расчёт»

**Файлы:**
- Создать: `components/calculation.tsx`
- Изменить: `app/page.tsx`

**Интерфейсы:**
- Потребляет: `calculation` из `lib/content.ts`; `SectionHeading`; `Reveal`;
  `LiquidMetalPanel` из `components/ui/liquid-metal-panel`.
- Производит: `Calculation()`.

- [ ] **Шаг 1: Скрипт проверки**

Создать `$SCR/check-2.mjs`:

```js
import { open, checkSection, report } from './harness.mjs';

const { browser, page, errors } = await open();

const r = await page.evaluate(() => {
  const s = document.querySelector('#calc');
  if (!s) return { ok: false, why: 'секции #calc нет' };
  const h2 = s.querySelector('h2');
  return {
    ok: true,
    inputs: s.querySelectorAll('[data-calc-input]').length,
    results: s.querySelectorAll('[data-calc-result]').length,
    cta: !!s.querySelector('a[href="#contacts"]'),
    labelled: s.getAttribute('aria-labelledby') === h2?.id,
    scrollMargin: getComputedStyle(s).scrollMarginTop,
    hOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
});

const fails = [];
checkSection(r, fails, '#calc');
if (r.ok) {
  if (r.inputs !== 4) fails.push(`ожидалось 4 вводных, получено ${r.inputs}`);
  if (r.results !== 3) fails.push(`ожидалось 3 результата, получено ${r.results}`);
  if (!r.cta) fails.push('нет ссылки на #contacts');
}
if (errors.length) fails.push('ошибки JS: ' + errors.join('; '));

await browser.close();
report(fails, r);
```

- [ ] **Шаг 2: Убедиться, что проверка падает**

Ожидается: `{"ok":false,"why":"секции #calc нет"}`, код выхода 1.

- [ ] **Шаг 3: Реализация**

Создать `components/calculation.tsx`:

```tsx
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/section-heading";
import { LiquidMetalPanel } from "@/components/ui/liquid-metal-panel";
import { calculation } from "@/lib/content";

export function Calculation() {
  return (
    <section
      id="calc"
      className="section-anchor w-full px-[var(--gutter)] py-24 lg:py-36"
      aria-labelledby="calc-title"
    >
      <SectionHeading
        id="calc-title"
        kicker={calculation.kicker}
        title={calculation.title}
      />

      <ul className="mt-14 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {calculation.inputs.map((input, index) => (
          <li key={input.id} className="flex" data-calc-input>
            <Reveal className="w-full" delay={index * 0.08}>
              <LiquidMetalPanel
                className="h-full w-full"
                innerClassName="flex h-full flex-col px-7 pb-9 pt-8"
              >
                <h3 className="text-base font-semibold tracking-[-0.01em] text-[var(--ink)]">
                  {input.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-white/50">
                  {input.body}
                </p>
              </LiquidMetalPanel>
            </Reveal>
          </li>
        ))}
      </ul>

      <p className="section-kicker mt-20 mb-7 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/45 sm:text-xs">
        {calculation.resultKicker}
      </p>

      <ul className="grid gap-10 sm:grid-cols-3 sm:gap-6">
        {calculation.results.map((result, index) => (
          <li key={result.id} data-calc-result>
            <Reveal delay={index * 0.08}>
              <h3 className="text-base font-semibold tracking-[-0.01em] text-[var(--ink)]">
                {result.title}
              </h3>
              <p className="mt-3 max-w-xs text-sm leading-6 text-white/50">
                {result.body}
              </p>
            </Reveal>
          </li>
        ))}
      </ul>

      <a
        href="#contacts"
        className="nav-link mt-14 inline-block text-sm font-semibold"
      >
        {calculation.cta} →
      </a>
    </section>
  );
}
```

- [ ] **Шаг 4: Подключить на страницу**

В `app/page.tsx` импортировать `Calculation` и вставить **после** `<HowItWorks />`.

- [ ] **Шаг 5: Убедиться, что проверка проходит**

`node check-2.mjs` → `PASS`. Затем `npm run typecheck && npm run lint`.

- [ ] **Шаг 6: Коммит**

```bash
git add components/calculation.tsx app/page.tsx
git commit -m "feat: add the calculation section"
```

---

### Задача 3: Секция «О нас»

**Файлы:**
- Создать: `components/about.tsx`
- Изменить: `app/page.tsx`

**Интерфейсы:**
- Потребляет: `about` из `lib/content.ts`; `SectionHeading`; `Reveal`.
- Производит: `About()`.

- [ ] **Шаг 1: Скрипт проверки**

Создать `$SCR/check-3.mjs`:

```js
import { open, checkSection, report } from './harness.mjs';

const { browser, page, errors } = await open();

const r = await page.evaluate(() => {
  const s = document.querySelector('#about');
  if (!s) return { ok: false, why: 'секции #about нет' };
  const h2 = s.querySelector('h2');
  return {
    ok: true,
    facts: s.querySelectorAll('[data-about-fact]').length,
    labelled: s.getAttribute('aria-labelledby') === h2?.id,
    scrollMargin: getComputedStyle(s).scrollMarginTop,
    hOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
});

const fails = [];
checkSection(r, fails, '#about');
if (r.ok && r.facts !== 3) fails.push(`ожидалось 3 факта, получено ${r.facts}`);
if (errors.length) fails.push('ошибки JS: ' + errors.join('; '));

await browser.close();
report(fails, r);
```

- [ ] **Шаг 2: Убедиться, что проверка падает**

Ожидается: `{"ok":false,"why":"секции #about нет"}`, код выхода 1.

- [ ] **Шаг 3: Реализация**

Создать `components/about.tsx`:

```tsx
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/section-heading";
import { about } from "@/lib/content";

export function About() {
  return (
    <section
      id="about"
      className="section-anchor w-full px-[var(--gutter)] py-24 lg:py-36"
      aria-labelledby="about-title"
    >
      <SectionHeading
        id="about-title"
        kicker={about.kicker}
        title={about.title}
      />

      <Reveal>
        <p className="mt-8 max-w-2xl text-base leading-7 text-white/55 sm:text-lg sm:leading-8">
          {about.body}
        </p>
      </Reveal>

      <dl className="mt-16 grid gap-10 sm:grid-cols-3 sm:gap-6">
        {about.facts.map((fact, index) => (
          <div key={fact.id} data-about-fact>
            <Reveal delay={index * 0.08}>
              <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/40">
                {fact.label}
              </dt>
              <dd className="mt-3 text-lg font-semibold tracking-[-0.02em] text-[var(--ink)]">
                {fact.value}
              </dd>
            </Reveal>
          </div>
        ))}
      </dl>
    </section>
  );
}
```

- [ ] **Шаг 4: Подключить на страницу**

Импортировать `About`, вставить **после** `<Calculation />`.

- [ ] **Шаг 5: Убедиться, что проверка проходит**

`node check-3.mjs` → `PASS`. Затем `npm run typecheck && npm run lint`.

- [ ] **Шаг 6: Коммит**

```bash
git add components/about.tsx app/page.tsx
git commit -m "feat: add the about section"
```

---

### Задача 4: Валидация заявки и Server Action

Логика без интерфейса. Проверяется на следующем шаге через форму, но
пишется отдельно, чтобы не смешивать правила валидации с разметкой.

**Файлы:**
- Создать: `lib/lead.ts`
- Создать: `app/actions/submit-lead.ts`

**Интерфейсы:**
- Производит:
  - `type LeadValues = { name: string; contact: string; company: string; goods: string }`
  - `type LeadFieldErrors = Partial<Record<keyof LeadValues, string>>`
  - `readLeadValues(formData: FormData): LeadValues`
  - `validateLead(values: LeadValues): LeadFieldErrors`
  - `type LeadState` — размеченное объединение, **в `lib/lead.ts`**
  - `INITIAL_LEAD_STATE: LeadState` — **тоже в `lib/lead.ts`**
  - `submitLead(prev: LeadState, formData: FormData): Promise<LeadState>` —
    единственный экспорт `app/actions/submit-lead.ts`

**Важно:** модуль с `"use server"` может экспортировать только асинхронные
функции. Константа рядом с действием роняет страницу в рантайме, а не на
сборке — поэтому тип состояния и его начальное значение живут в `lib/lead.ts`.

- [ ] **Шаг 1: Модуль валидации**

Создать `lib/lead.ts`:

```ts
export type LeadValues = {
  name: string;
  contact: string;
  company: string;
  goods: string;
};

export type LeadFieldErrors = Partial<Record<keyof LeadValues, string>>;

export const LEAD_LIMITS = {
  name: { min: 2, max: 80 },
  company: { max: 120 },
  goods: { min: 10, max: 2000 },
} as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function isPhone(value: string) {
  // Ten digits is the shortest real number here once formatting is stripped.
  return value.replace(/\D/g, "").length >= 10;
}

export function readLeadValues(formData: FormData): LeadValues {
  const read = (key: string) => String(formData.get(key) ?? "").trim();

  return {
    name: read("name"),
    contact: read("contact"),
    company: read("company"),
    goods: read("goods"),
  };
}

export function validateLead(values: LeadValues): LeadFieldErrors {
  const errors: LeadFieldErrors = {};

  if (values.name.length < LEAD_LIMITS.name.min) {
    errors.name = "Укажите имя — минимум 2 символа.";
  } else if (values.name.length > LEAD_LIMITS.name.max) {
    errors.name = "Слишком длинное имя.";
  }

  if (!values.contact) {
    errors.contact = "Оставьте телефон или почту.";
  } else if (!EMAIL.test(values.contact) && !isPhone(values.contact)) {
    errors.contact = "Не похоже на телефон или почту.";
  }

  if (values.company.length > LEAD_LIMITS.company.max) {
    errors.company = "Слишком длинное название.";
  }

  if (values.goods.length < LEAD_LIMITS.goods.min) {
    errors.goods = "Опишите товар — минимум 10 символов.";
  } else if (values.goods.length > LEAD_LIMITS.goods.max) {
    errors.goods = "Слишком длинное описание.";
  }

  return errors;
}
```

- [ ] **Шаг 2: Server Action**

Создать `app/actions/submit-lead.ts`:

```ts
"use server";

import {
  readLeadValues,
  validateLead,
  type LeadFieldErrors,
  type LeadValues,
} from "@/lib/lead";

export type LeadState =
  | { status: "idle" }
  | { status: "invalid"; values: LeadValues; fieldErrors: LeadFieldErrors }
  | { status: "unavailable"; values: LeadValues }
  | { status: "failed"; values: LeadValues };

export const INITIAL_LEAD_STATE: LeadState = { status: "idle" };

/**
 * The seam. Wiring a real channel — Telegram, email, a CRM — is a change to
 * this function plus environment variables, and nothing else.
 *
 * It reports "unavailable" rather than pretending to succeed: a landing page
 * that swallows enquiries loses customers silently.
 */
async function deliverLead(_values: LeadValues): Promise<"delivered" | "unavailable"> {
  return "unavailable";
}

export async function submitLead(
  _previous: LeadState,
  formData: FormData,
): Promise<LeadState> {
  const values = readLeadValues(formData);

  // Honeypot: a real person never fills a field they cannot see.
  if (String(formData.get("website") ?? "")) {
    return { status: "unavailable", values };
  }

  const fieldErrors = validateLead(values);

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "invalid", values, fieldErrors };
  }

  try {
    await deliverLead(values);
    return { status: "unavailable", values };
  } catch {
    return { status: "failed", values };
  }
}
```

- [ ] **Шаг 3: Проверить статически**

Запустить: `npm run typecheck && npm run lint`
Ожидается: обе команды чисто. Визуальной проверки на этом шаге нет —
модуль ещё никем не вызывается.

- [ ] **Шаг 4: Коммит**

```bash
git add lib/lead.ts app/actions/submit-lead.ts
git commit -m "feat: lead validation and the submit seam"
```

---

### Задача 5: Поле ввода, форма и секция «Контакты»

**Файлы:**
- Создать: `components/ui/text-field.tsx`
- Создать: `components/lead-form.tsx`
- Создать: `components/contact.tsx`
- Изменить: `app/globals.css` (стили поля)
- Изменить: `app/page.tsx`

**Интерфейсы:**
- Потребляет: `submitLead`, `INITIAL_LEAD_STATE`, `LeadState` из
  `app/actions/submit-lead`; `contact` из `lib/content`; `SectionHeading`.
- Производит: `TextField(props)`, `LeadForm()`, `Contact()`.

- [ ] **Шаг 1: Скрипт проверки**

Создать `$SCR/check-5.mjs`:

```js
import { open, report } from './harness.mjs';

const { browser, page, errors } = await open();
const fails = [];

if (!(await page.evaluate(() => !!document.querySelector('#contacts form')))) {
  await browser.close();
  report(['формы в #contacts нет']);
}

// у каждого видимого поля есть связанный label
const labelled = await page.evaluate(() =>
  [...document.querySelectorAll('#contacts form input:not([type=hidden]):not(.sr-only), #contacts form textarea')]
    .every((el) => !!document.querySelector(`label[for="${el.id}"]`)));
if (!labelled) fails.push('есть поле без связанного label');

// клавиатурный проход: от первого поля до кнопки отправки без мышью
await page.locator('#contacts input[name=name]').focus();
const reached = [];
for (let i = 0; i < 6; i++) {
  reached.push(await page.evaluate(() => {
    const a = document.activeElement;
    return a?.getAttribute('name') ?? a?.tagName.toLowerCase();
  }));
  await page.keyboard.press('Tab');
}
for (const field of ['name', 'contact', 'company', 'goods']) {
  if (!reached.includes(field)) fails.push(`клавиатурой не достать поле ${field}`);
}
if (!reached.includes('button')) fails.push('клавиатурой не достать кнопку отправки');

// пустая отправка -> ошибки под полями, фокус на первом сломанном
await page.locator('#contacts form button[type=submit]').click();
await page.waitForTimeout(1500);
const invalid = await page.evaluate(() => ({
  count: document.querySelectorAll('#contacts [aria-invalid="true"]').length,
  focused: document.activeElement?.getAttribute('name'),
  described: [...document.querySelectorAll('#contacts [aria-invalid="true"]')]
    .every((el) => !!document.getElementById(el.getAttribute('aria-describedby') ?? '')),
}));
if (invalid.count !== 3) fails.push(`ожидалось 3 ошибочных поля, получено ${invalid.count}`);
if (!invalid.described) fails.push('aria-describedby не указывает на текст ошибки');
if (invalid.focused !== 'name') fails.push(`фокус на "${invalid.focused}", ожидалось "name"`);

// корректная отправка -> честное «не подключено», данные не потеряны
await page.fill('#contacts input[name=name]', 'Даниил');
await page.fill('#contacts input[name=contact]', 'test@example.com');
await page.fill('#contacts textarea[name=goods]', 'Партия керамической плитки из Турции, 12 паллет.');
await page.locator('#contacts form button[type=submit]').click();
await page.waitForTimeout(1500);
const after = await page.evaluate(() => ({
  status: document.querySelector('#contacts [data-lead-status]')?.getAttribute('data-lead-status'),
  keptName: document.querySelector('#contacts input[name=name]')?.value,
  stillInvalid: document.querySelectorAll('#contacts [aria-invalid="true"]').length,
}));
if (after.status !== 'unavailable') fails.push(`статус "${after.status}", ожидалось "unavailable"`);
if (after.keptName !== 'Даниил') fails.push('введённые данные потеряны');
if (after.stillInvalid !== 0) fails.push('ошибки не сняты после исправления');

if (errors.length) fails.push('ошибки JS: ' + errors.join('; '));

await browser.close();
report(fails, { labelled, reached, invalid, after });
```

- [ ] **Шаг 2: Убедиться, что проверка падает**

Ожидается: `FAIL: формы в #contacts нет`, код выхода 1.

- [ ] **Шаг 3: Стили поля**

В `app/globals.css` добавить перед `.spline-loader {`:

```css
/* Only colour and shape here. Layout stays in utilities: rules in this file
   load after Tailwind at equal specificity and would beat its variants. */
.text-field {
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 0.85rem;
  background: rgba(255, 255, 255, 0.03);
  color: var(--ink);
  transition:
    border-color 200ms ease,
    background-color 200ms ease;
}

.text-field::placeholder {
  color: rgba(255, 255, 255, 0.28);
}

.text-field:hover {
  border-color: rgba(255, 255, 255, 0.16);
}

.text-field:focus-visible {
  border-color: color-mix(in srgb, var(--accent) 55%, transparent);
  background: rgba(255, 255, 255, 0.05);
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.text-field[aria-invalid="true"] {
  border-color: #f87171;
}

.field-error {
  color: #fca5a5;
}
```

- [ ] **Шаг 4: Примитив поля**

Создать `components/ui/text-field.tsx`:

```tsx
import { cn } from "@/lib/utils";

interface TextFieldProps {
  id: string;
  name: string;
  label: string;
  type?: string;
  rows?: number;
  required?: boolean;
  error?: string;
  defaultValue?: string;
  autoComplete?: string;
  placeholder?: string;
  className?: string;
}

export function TextField({
  id,
  name,
  label,
  type = "text",
  rows,
  required = false,
  error,
  defaultValue,
  autoComplete,
  placeholder,
  className,
}: TextFieldProps) {
  const errorId = `${id}-error`;
  const isTextarea = typeof rows === "number";

  const shared = {
    id,
    name,
    defaultValue,
    placeholder,
    autoComplete,
    required,
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": error ? errorId : undefined,
    className: "text-field w-full px-4 py-3 text-sm",
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-sm text-white/60">
        {label}
        {!required && <span className="text-white/30"> — необязательно</span>}
      </label>

      {isTextarea ? (
        <textarea {...shared} rows={rows} />
      ) : (
        <input {...shared} type={type} />
      )}

      {/* The message is text, not just a red border: colour alone is not a
          signal everyone can read. */}
      {error && (
        <p id={errorId} className="field-error text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Шаг 5: Форма**

Создать `components/lead-form.tsx`:

```tsx
"use client";

import { useActionState, useEffect, useRef } from "react";

import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";
import { TextField } from "@/components/ui/text-field";
import {
  INITIAL_LEAD_STATE,
  submitLead,
  type LeadState,
} from "@/app/actions/submit-lead";

const FIELD_ORDER = ["name", "contact", "company", "goods"] as const;

function errorFor(state: LeadState, field: string) {
  return state.status === "invalid"
    ? state.fieldErrors[field as keyof typeof state.fieldErrors]
    : undefined;
}

function valueFor(state: LeadState, field: string) {
  return "values" in state
    ? state.values[field as keyof typeof state.values]
    : undefined;
}

export function LeadForm() {
  const [state, formAction, isPending] = useActionState(
    submitLead,
    INITIAL_LEAD_STATE,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Land the caret on the first broken field instead of leaving the person to
  // hunt for the red one.
  useEffect(() => {
    if (state.status !== "invalid") {
      return;
    }

    const firstBroken = FIELD_ORDER.find((field) => field in state.fieldErrors);

    if (firstBroken) {
      formRef.current
        ?.querySelector<HTMLElement>(`[name="${firstBroken}"]`)
        ?.focus();
    }
  }, [state]);

  return (
    // noValidate: иначе `required` включает нативную валидацию, она блокирует
    // запрос до вызова действия, и серверные сообщения не показываются.
    <form
      ref={formRef}
      action={formAction}
      noValidate
      className="flex flex-col gap-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="lead-name"
          name="name"
          label="Имя"
          required
          autoComplete="name"
          error={errorFor(state, "name")}
          defaultValue={valueFor(state, "name")}
        />
        <TextField
          id="lead-contact"
          name="contact"
          label="Телефон или почта"
          required
          autoComplete="email"
          error={errorFor(state, "contact")}
          defaultValue={valueFor(state, "contact")}
        />
      </div>

      <TextField
        id="lead-company"
        name="company"
        label="Компания"
        autoComplete="organization"
        error={errorFor(state, "company")}
        defaultValue={valueFor(state, "company")}
      />

      <TextField
        id="lead-goods"
        name="goods"
        label="Что везёте"
        rows={5}
        required
        placeholder="Название, состав, назначение, страна происхождения."
        error={errorFor(state, "goods")}
        defaultValue={valueFor(state, "goods")}
      />

      {/* Honeypot. Hidden from people and from screen readers alike. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="sr-only"
      />

      <div className="mt-2 flex flex-wrap items-center gap-5">
        <LiquidMetalButton
          type="submit"
          label={isPending ? "Отправляем…" : "Отправить заявку"}
          disabled={isPending}
        />
      </div>

      <p
        aria-live="polite"
        data-lead-status={state.status}
        className="text-sm leading-6 text-white/50"
      >
        {state.status === "unavailable" &&
          "Приём заявок пока не подключён. Свяжитесь с нами по контактам рядом — данные из формы не потеряны."}
        {state.status === "failed" &&
          "Не получилось отправить. Попробуйте ещё раз или напишите нам напрямую."}
      </p>
    </form>
  );
}
```

- [ ] **Шаг 6: Секция**

Создать `components/contact.tsx`:

```tsx
import { LeadForm } from "@/components/lead-form";
import { SectionHeading } from "@/components/section-heading";
import { contact } from "@/lib/content";

export function Contact() {
  return (
    <section
      id="contacts"
      className="section-anchor w-full px-[var(--gutter)] py-24 lg:py-36"
      aria-labelledby="contacts-title"
    >
      <SectionHeading
        id="contacts-title"
        kicker={contact.kicker}
        title={contact.title}
      />

      <div className="mt-14 grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <p className="max-w-md text-base leading-7 text-white/55">
            {contact.body}
          </p>

          <dl className="mt-10 flex flex-col gap-6">
            {contact.channels.map((channel) => (
              <div key={channel.id}>
                <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/40">
                  {channel.label}
                </dt>
                <dd className="mt-2 text-base text-[var(--ink)]">
                  {channel.href ? (
                    <a href={channel.href} className="nav-link">
                      {channel.value}
                    </a>
                  ) : (
                    channel.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <LeadForm />
      </div>
    </section>
  );
}
```

- [ ] **Шаг 7: Подключить на страницу**

Импортировать `Contact`, вставить **после** `<About />`.

- [ ] **Шаг 8: Убедиться, что проверка проходит**

`node check-5.mjs` → `PASS`. Затем `npm run typecheck && npm run lint`.

Если `LiquidMetalButton` не принимает `type` или `disabled` — он расширяет
`ButtonHTMLAttributes<HTMLButtonElement>`, так что принимает оба. Проверить,
что `type="submit"` доезжает до внутреннего `<button>`, а не перекрывается
значением по умолчанию `"button"`.

- [ ] **Шаг 9: Коммит**

```bash
git add components/ui/text-field.tsx components/lead-form.tsx components/contact.tsx app/globals.css app/page.tsx
git commit -m "feat: lead form and the contacts section"
```

---

### Задача 6: Футер, живые якоря и документация

**Файлы:**
- Создать: `components/site-footer.tsx`
- Изменить: `components/site-header.tsx` (NAV_ITEMS)
- Изменить: `app/page.tsx`
- Изменить: `DESIGN.md`

**Интерфейсы:**
- Потребляет: `footer` из `lib/content`.
- Производит: `SiteFooter()`.

- [ ] **Шаг 1: Скрипт проверки**

Создать `$SCR/check-6.mjs`:

```js
import { open, report } from './harness.mjs';

const HREFS = ['#hero', '#services', '#calc', '#about', '#contacts'];
const fails = [];

// три ширины: мёртвые ссылки, цели якорей, переполнение, футер
for (const width of [1680, 1280, 390]) {
  const { browser, page, errors } = await open({ width, height: width < 500 ? 844 : 900 });

  const r = await page.evaluate((hrefs) => ({
    dead: document.querySelectorAll('a[href="#"]').length,
    missing: hrefs.filter((h) => !document.querySelector(h)),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    footer: !!document.querySelector('footer'),
  }), HREFS);

  if (r.dead) fails.push(`${width}: осталось ${r.dead} мёртвых ссылок href="#"`);
  if (r.missing.length) fails.push(`${width}: нет целей ${r.missing.join(', ')}`);
  if (r.overflow !== 0) fails.push(`${width}: горизонтальное переполнение ${r.overflow}px`);
  if (!r.footer) fails.push(`${width}: футера нет`);
  if (errors.length) fails.push(`${width}: ошибки JS — ${errors.join('; ')}`);

  await browser.close();
}

// якоря приземляются под хедером, а не под ним
{
  const { browser, page } = await open();
  for (const href of ['#calc', '#about', '#contacts']) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    await page.locator(`header nav a[href="${href}"]`).click();
    await page.waitForTimeout(1600);
    const gap = await page.evaluate((h) => {
      const bar = document.querySelector('.site-header-bar').getBoundingClientRect();
      const sec = document.querySelector(h).getBoundingClientRect();
      return +(sec.top - bar.bottom).toFixed(1);
    }, href);
    // Отрицательный зазор = заголовок секции уехал под хедер.
    if (gap < -1) fails.push(`${href}: секция под хедером, зазор ${gap}px`);
  }
  await browser.close();
}

report(fails);
```

- [ ] **Шаг 2: Убедиться, что проверка падает**

Ожидается: `FAIL` — мёртвые ссылки `#` в навигации и отсутствие футера.

- [ ] **Шаг 3: Футер**

Создать `components/site-footer.tsx`:

```tsx
import { footer } from "@/lib/content";

const FOOTER_LINKS = [
  { title: "Главная", href: "#hero" },
  { title: "Услуги", href: "#services" },
  { title: "Расчёт", href: "#calc" },
  { title: "О нас", href: "#about" },
  { title: "Контакты", href: "#contacts" },
] as const;

export function SiteFooter() {
  // Rendered on the server, so the year cannot disagree across hydration.
  const year = new Date().getFullYear();

  return (
    <footer className="w-full px-[var(--gutter)] pb-14 pt-20">
      <div className="flex flex-col gap-10 border-t border-white/[0.07] pt-12 md:flex-row md:items-start md:justify-between">
        <p className="site-brand text-base font-semibold tracking-[-0.02em]">
          MyTamga
        </p>

        <nav aria-label="Навигация в подвале">
          <ul className="flex flex-wrap gap-x-7 gap-y-3">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="nav-link text-sm">
                  {link.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <p className="mt-12 text-xs leading-5 text-white/30">
        © {year} MyTamga. {footer.legal}
      </p>
    </footer>
  );
}
```

- [ ] **Шаг 4: Живые якоря в хедере**

В `components/site-header.tsx` заменить `NAV_ITEMS` на:

```tsx
const NAV_ITEMS = [
  { title: "Главная", href: "#hero" },
  { title: "Услуги", href: "#services" },
  { title: "Расчёт", href: "#calc" },
  { title: "О нас", href: "#about" },
  { title: "Контакты", href: "#contacts" },
] as const;
```

Комментарий про несуществующие секции над массивом удалить — он больше не
соответствует действительности.

- [ ] **Шаг 5: Подключить футер**

В `app/page.tsx` импортировать `SiteFooter` и поставить **после** `</main>`,
внутри фрагмента: футер не является частью основного содержания.

Итоговый `app/page.tsx`:

```tsx
import { About } from "@/components/about";
import { Calculation } from "@/components/calculation";
import { Capabilities } from "@/components/capabilities";
import { Contact } from "@/components/contact";
import { SplineSceneBasic } from "@/components/demo";
import { HowItWorks } from "@/components/how-it-works";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <>
      <main>
        <SplineSceneBasic />
        <Capabilities />
        <HowItWorks />
        <Calculation />
        <About />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
```

- [ ] **Шаг 6: Убедиться, что проверка проходит**

`node check-6.mjs` → `PASS`. Затем `npm run typecheck && npm run lint`.

- [ ] **Шаг 7: Проверить reduced-motion**

Создать `$SCR/check-6-rm.mjs`:

```js
import { open, report } from './harness.mjs';

const { browser, page, errors } = await open({ reducedMotion: 'reduce' });
const fails = [];

// прокручиваем всю страницу, чтобы все секции побывали в вьюпорте
await page.evaluate(async () => {
  const step = window.innerHeight / 2;
  for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 120));
  }
});
await page.waitForTimeout(1200);

const r = await page.evaluate(() => {
  const nodes = [
    ...document.querySelectorAll('#how li > div'),
    ...document.querySelectorAll('[data-calc-input] > div'),
    ...document.querySelectorAll('[data-about-fact] > div'),
  ];
  return {
    total: nodes.length,
    faded: nodes.filter((n) => getComputedStyle(n).opacity !== '1').length,
    moved: nodes.filter((n) => {
      const tr = getComputedStyle(n).transform;
      return tr !== 'none' && tr !== 'matrix(1, 0, 0, 1, 0, 0)';
    }).length,
  };
});

if (r.total === 0) fails.push('не найдено ни одного проявляемого узла — селекторы разошлись с разметкой');
if (r.faded !== 0) fails.push(`${r.faded} узлов остались прозрачными при reduced-motion`);
if (r.moved !== 0) fails.push(`${r.moved} узлов смещены при reduced-motion`);
if (errors.length) fails.push('ошибки JS: ' + errors.join('; '));

await browser.close();
report(fails, r);
```

Запустить: `cd "$SCR" && CHROME_EXE="$CHROME" node check-6-rm.mjs`
Ожидается: `PASS`.

- [ ] **Шаг 8: Дополнить DESIGN.md**

Добавить раздел `## Sections` перед `## Motion`:

```markdown
## Sections

- The page is one document: hero, capabilities, how it works, calculation,
  about, contacts, footer. Navigation is anchors, not routes.
- Every section reads its copy from `lib/content.ts`. Nothing is written
  inline, so replacing the placeholders with the client's wording is one
  edit in one file.
- Sections share `SectionHeading` and the `--gutter` inset, so their left
  edges line up with the hero copy at every width.
- `Reveal` is the single client boundary for entrance animation; the
  sections themselves stay server components.
- The lead form posts to a Server Action and reports honestly that intake
  is not connected. It never fakes a success.
```

- [ ] **Шаг 9: Коммит**

```bash
git add components/site-footer.tsx components/site-header.tsx app/page.tsx DESIGN.md
git commit -m "feat: footer, live anchors and section docs"
```

- [ ] **Шаг 10: Запушить**

```bash
git push
```

---

## Что остаётся открытым после плана

1. **«Услуги» или «Возможности»** — навигация и секция называются
   по-разному. Решение за заказчиком, в плане ничего не меняется.
2. **Подтвердить вводные расчёта** — четыре пункта помечены `REVIEW(copy)`.
3. **Блокеры запуска** из спеки: приём заявок, заглушки в «О нас» и
   «Контактах», `title`/`description` страницы, кикер героя.
