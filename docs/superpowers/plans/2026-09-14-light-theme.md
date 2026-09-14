# Светлая тема MyTamga — план реализации

> **Для агентов-исполнителей:** ОБЯЗАТЕЛЬНЫЙ СУБ-СКИЛЛ: superpowers:subagent-driven-development
> (рекомендуется) или superpowers:executing-plans. Шаги размечены чекбоксами.

**Цель:** добавить светлую тему «галерейный белый» рядом с существующей тёмной,
с переключателем в хедере и без вспышки при загрузке.

**Архитектура:** отсутствие атрибута на `<html>` = тёмная, `:root[data-theme="light"]`
переопределяет значения токенов. Синхронный скрипт в `<head>` ставит атрибут до
первой отрисовки. Захардкоженные цвета переводятся на семантические токены так,
что тёмная тема остаётся побайтно прежней, кроме задокументированного сведения
уровней прозрачности.

**Стек:** Next.js 16.3, React 19, Tailwind v4 (`@theme inline`), framer-motion.

**Спека:** `docs/superpowers/specs/2026-09-14-light-theme-design.md`

## Глобальные ограничения

- Новых зависимостей в проекте нет. `playwright-core` живёт только в скратчпаде.
- Тёмная тема побайтно прежняя. Допустимо только: текст белый 50/55/60 % → 55 %,
  40/45 % → 45 %; рамки 7/8/9 % → 8 %; свечение прелоадера 6 % → 7 %.
- Не трогать: `liquid-metal-button.tsx`, `liquid-loader.tsx`, `splite.tsx`,
  маску `.hero-stage` (`#000` там — альфа, не цвет).
- Текстовые токены светлой ≥ 4.5:1 на `--canvas` и `--surface`.
- Порядок заметности в обеих темах: `--ink` > `--ink-muted` > `--ink-soft` >
  `--ink-faint` ≥ `--ink-ghost`.
- В `globals.css` — только цвет и форма; раскладка — в утилитах.
- `backdrop-filter`: префикс первым, стандарт последним.
- Механизм — строго по `node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md`.
- Комментарии в коде по-английски, тексты интерфейса по-русски.

## Поправки к спеке, найденные при планировании

1. **Подсветка героя.** Спека предлагает класс с `opacity: .55`. Но `Spotlight`
   уже переключает непрозрачность утилитами (`opacity-20` / `opacity-0`), и
   класс прибил бы её намертво — пятно светилось бы всегда. Вместо этого
   цвет идёт через токен: `fill="var(--spotlight)"`, тёмная `#c7a7ff`,
   светлая `rgb(109 79 209 / .55)`. Наведение не затронуто.
2. **Нейтральные оттенки.** Около 25 мест в `globals.css` используют
   `rgba(255,255,255,α)` с разными α. Вместо токена на каждую α вводится
   помощник `--fg-rgb`: `255 255 255` в тёмной, `21 22 21` в светлой.
   Запись `rgb(var(--fg-rgb) / α)` в тёмной вычисляется ровно в прежний цвет.
3. **Тень мобильного меню.** `rgba(0,0,0,.72)` на бумаге — тяжёлый тёмный ореол.
   Токен `--shadow-panel`.

## Верификация

Тестового раннера в проекте нет. Цикл «красный → зелёный» выполняет стенд на
`playwright-core` в скратчпаде против dev-сервера `npm run dev` на `:3000`.

```
SCR=<скратчпад сессии>
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

## Карта файлов

| Файл | Изменение |
| --- | --- |
| `app/globals.css` | токены, светлый блок, перевод захардкоженного |
| `app/layout.tsx` | скрипт в `<head>`, `suppressHydrationWarning` |
| `components/theme-toggle.tsx` | **новый** — переключатель |
| `components/site-header.tsx` | обёртка третьей колонки |
| `components/ui/liquid-metal-panel.tsx` | лицо карточки → CSS-класс |
| `components/demo.tsx` | заголовок, абзац, кикер, подсветка |
| 9 компонентов секций | `text-white/NN`, `border-white/[…]` → утилиты |
| `DESIGN.md` | раздел «Themes» |

---

### Задача 1: Стенд и слепок тёмной темы

Слепок снимается **до любой правки** — это оракул для всех следующих задач.

**Файлы:**
- Создать: `$SCR/harness.mjs`, `$SCR/snapshot.mjs`
- Создать: `$SCR/baseline-dark.json` (результат)

**Интерфейсы:**
- Производит: `open({ width, height, theme, reducedMotion })`,
  `report(fails, payload)`; `node snapshot.mjs capture <file>` и
  `node snapshot.mjs compare <file> [--skip-header]`.

- [ ] **Шаг 1: Стенд**

`$SCR/harness.mjs`:

```js
import { chromium } from 'playwright-core';

export async function open({ width = 1680, height = 1000, theme, reducedMotion, url = 'http://localhost:3000/' } = {}) {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_EXE,
    args: ['--use-gl=angle', '--enable-unsafe-swiftshader'],
  });
  const context = await browser.newContext({
    viewport: { width, height },
    isMobile: width < 500,
    ...(reducedMotion ? { reducedMotion } : {}),
  });
  // Theme is seeded into storage before any page script runs, exactly as a
  // returning visitor would arrive.
  if (theme) {
    await context.addInitScript((t) => { try { localStorage.setItem('theme', t); } catch {} }, theme);
  }
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message.split('\n')[0]));
  page.on('console', (m) => {
    if (m.type() === 'error' && /hydrat/i.test(m.text())) errors.push('HYDRATION: ' + m.text().split('\n')[0]);
  });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('.site-preloader', { state: 'detached', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2500);
  return { browser, page, errors };
}

export function report(fails, payload) {
  if (payload) console.log(JSON.stringify(payload));
  if (fails.length) { console.log('FAIL:\n' + fails.join('\n')); process.exit(1); }
  console.log('PASS');
}
```

- [ ] **Шаг 2: Слепок**

`$SCR/snapshot.mjs`:

```js
import fs from 'node:fs';
import { open, report } from './harness.mjs';

const [mode, file, flag] = process.argv.slice(2);
const skipHeader = flag === '--skip-header';

const { browser, page } = await open();
const snap = await page.evaluate((skipHeader) => {
  const PROPS = ['color', 'background-color', 'background-image', 'border-top-color', 'box-shadow'];
  const path = (el) => {
    const parts = [];
    for (let n = el; n && n.nodeType === 1 && n !== document.documentElement; n = n.parentElement) {
      const i = [...n.parentElement.children].indexOf(n);
      parts.unshift(`${n.tagName.toLowerCase()}:${i}`);
    }
    return parts.join('>');
  };
  const out = {};
  const grab = (key, cs) => { out[key] = Object.fromEntries(PROPS.map((p) => [p, cs.getPropertyValue(p)])); };
  // body and html carry the canvas glow; pseudo-elements carry the orbit, the
  // scene glow and the kicker rule — none of them are reachable via `body *`.
  grab('html', getComputedStyle(document.documentElement));
  grab('body', getComputedStyle(document.body));
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('canvas, script, style, .site-preloader')) continue;
    if (skipHeader && el.closest('header')) continue;
    const key = path(el);
    grab(key, getComputedStyle(el));
    for (const pseudo of ['::before', '::after']) {
      const ps = getComputedStyle(el, pseudo);
      if (ps.content && ps.content !== 'none') grab(key + pseudo, ps);
    }
  }
  return out;
}, skipHeader);
await browser.close();

if (mode === 'capture') {
  fs.writeFileSync(file, JSON.stringify(snap));
  console.log(`слепок: ${Object.keys(snap).length} элементов → ${file}`);
  process.exit(0);
}

// compare: every difference must be one of the documented white-alpha collapses
const base = JSON.parse(fs.readFileSync(file, 'utf8'));
// Tailwind v4 serialises white-with-alpha as oklab(≈1 ≈0 ≈0 / a); a CSS token
// serialises as rgba(255, 255, 255, a). Same colour, different spelling.
const whiteAlpha = (v) => {
  let m = v.match(/^rgba\(255, 255, 255, ([0-9.]+)\)$/);
  if (m) return +m[1];
  m = v.match(/^oklab\(([0-9.]+) (-?[0-9.e-]+) (-?[0-9.e-]+) \/ ([0-9.]+)\)$/);
  if (m && +m[1] > 0.9999 && Math.abs(+m[2]) < 1e-3 && Math.abs(+m[3]) < 1e-3) return +m[4];
  return null;
};
// Tailwind's shadow utilities prepend four no-op layers; a plain CSS rule doesn't.
const cleanShadow = (v) => v.split(/,(?![^(]*\))/).map((s) => s.trim())
  .filter((s) => s !== 'rgba(0, 0, 0, 0) 0px 0px 0px 0px').join(', ') || 'none';
const fails = [];
let allowed = 0;
for (const [key, props] of Object.entries(base)) {
  if (skipHeader && key.includes('header:')) continue;
  const now = snap[key];
  if (!now) { fails.push(`пропал элемент ${key}`); continue; }
  for (const [p, before] of Object.entries(props)) {
    const after = now[p];
    if (before === after) continue;
    if (p === 'box-shadow' && cleanShadow(before) === cleanShadow(after)) continue;
    const a = whiteAlpha(before), b = whiteAlpha(after);
    if (a !== null && b !== null) {
      if (Math.abs(a - b) < 1e-6) continue;
      if (Math.abs(a - b) <= 0.051) { allowed++; continue; }
    }
    fails.push(`${key} ${p}: ${before} → ${after}`);
  }
}
report(fails.slice(0, 25), { elements: Object.keys(base).length, allowedCollapses: allowed, unexpected: fails.length });
```

- [ ] **Шаг 3: Снять эталон**

Run: `cd "$SCR" && CHROME_EXE="$CHROME" node snapshot.mjs capture baseline-dark.json`
Expected: `слепок: N элементов`, N > 200.

- [ ] **Шаг 4: Проверить, что сравнение с самим собой проходит**

Run: `node snapshot.mjs compare baseline-dark.json`
Expected: `PASS`, `allowedCollapses: 0`, `unexpected: 0`. Это доказывает, что
слепок детерминирован — иначе дальнейшие сравнения ничего не значат.

Коммита нет: стенд живёт в скратчпаде.

---

### Задача 2: Токены и перевод `globals.css`

**Файлы:** Изменить: `app/globals.css`

**Интерфейсы:**
- Производит: CSS-переменные из таблицы спеки + `--fg-rgb`, `--spotlight`,
  `--shadow-panel`; утилиты `text-ink`, `text-ink-muted`, `text-ink-soft`,
  `text-ink-faint`, `text-ink-ghost`, `border-line-soft`; класс
  `.liquid-metal-face` (с `[data-active="true"]`).

- [ ] **Шаг 1: Токены в `:root`** — дописать после `--scrollbar-thumb-hover`,
  значения тёмные и равны текущим:

```css
  /* Neutral tint helper: rgb(var(--fg-rgb) / a) resolves to exactly the white
     alpha used before in the dark theme, and to ink alphas in the light one. */
  --fg-rgb: 255 255 255;
  --ink-soft: rgb(255 255 255 / 0.55);
  --ink-faint: rgb(255 255 255 / 0.45);
  --ink-ghost: rgb(255 255 255 / 0.3);
  --line-soft: rgb(255 255 255 / 0.08);
  --on-accent: #080909;
  --danger: #fca5a5;
  --danger-line: #f87171;
  --hero-title: linear-gradient(145deg, #fff 8%, #d4d4ce 53%, #777b79 100%);
  --panel-face: linear-gradient(180deg, #171818 0%, #0a0c0c 58%, #050606 100%);
  --panel-face-active: linear-gradient(145deg, #241a31 0%, #130e1c 48%, #07060b 100%);
  --panel-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
  --panel-shadow-active: inset 0 1px 0 rgba(231, 217, 255, 0.26), inset 0 -10px 30px rgba(104, 68, 158, 0.2);
  --canvas-glow: rgba(199, 167, 255, 0.07);
  --scene-glow: rgba(199, 167, 255, 0.12);
  --orbit-line: rgba(199, 167, 255, 0.13);
  --orbit-halo-1: rgba(199, 167, 255, 0.018);
  --orbit-halo-2: rgba(199, 167, 255, 0.012);
  --field-bg: rgba(255, 255, 255, 0.03);
  --field-line: rgba(255, 255, 255, 0.09);
  --spotlight: #c7a7ff;
  --shadow-panel: 0 24px 60px rgba(0, 0, 0, 0.72);
```

- [ ] **Шаг 2: Утилиты** — в `@theme inline` дописать:

```css
  --color-ink: var(--ink);
  --color-ink-muted: var(--ink-muted);
  --color-ink-soft: var(--ink-soft);
  --color-ink-faint: var(--ink-faint);
  --color-ink-ghost: var(--ink-ghost);
  --color-line-soft: var(--line-soft);
```

- [ ] **Шаг 3: Перевод захардкоженного** — скрипт, а не ручные правки:

```python
from pathlib import Path
import re
p = Path("app/globals.css"); t = p.read_text()
root_end = t.index("}", t.index(":root {")) + 1
head, body = t[:root_end], t[root_end:]

# neutral white tints -> helper (dark resolves to the identical colour)
body = re.sub(r"rgba\(255, 255, 255, ([0-9.]+)\)", r"rgb(var(--fg-rgb) / \1)", body)

named = {
  "radial-gradient(circle at 50% 0%, rgba(199, 167, 255, 0.07), transparent 38rem)":
    "radial-gradient(circle at 50% 0%, var(--canvas-glow), transparent 38rem)",
  "radial-gradient(circle at 50% 40%, rgba(199, 167, 255, 0.06), transparent 32rem)":
    "radial-gradient(circle at 50% 40%, var(--canvas-glow), transparent 32rem)",
  "border: 1px solid rgba(199, 167, 255, 0.13);": "border: 1px solid var(--orbit-line);",
  "0 0 0 8rem rgba(199, 167, 255, 0.018),": "0 0 0 8rem var(--orbit-halo-1),",
  "0 0 0 16rem rgba(199, 167, 255, 0.012);": "0 0 0 16rem var(--orbit-halo-2);",
  "radial-gradient(circle, rgba(199, 167, 255, 0.12), transparent 66%)":
    "radial-gradient(circle, var(--scene-glow), transparent 66%)",
  "box-shadow: 0 24px 60px rgba(0, 0, 0, 0.72);": "box-shadow: var(--shadow-panel);",
  "border-color: #f87171;": "border-color: var(--danger-line);",
  "color: #fca5a5;": "color: var(--danger);",
}
for old, new in named.items():
    assert old in body, old
    body = body.replace(old, new)

# selection text sits on the accent, so it follows the accent's contrast pair
sel_old = "::selection {\n  background: var(--accent);\n  color: #080909;\n}"
assert sel_old in body
body = body.replace(sel_old, "::selection {\n  background: var(--accent);\n  color: var(--on-accent);\n}")

# text-field colours move to the field tokens
field_old = "border: 1px solid rgb(var(--fg-rgb) / 0.09);\n  border-radius: 0.85rem;\n  background: rgb(var(--fg-rgb) / 0.03);"
assert field_old in body, "text-field block not found"
body = body.replace(field_old, "border: 1px solid var(--field-line);\n  border-radius: 0.85rem;\n  background: var(--field-bg);")
p.write_text(head + body)
```

- [ ] **Шаг 4: Класс лица карточки** — добавить перед `.spline-loader {`:

```css
/* The liquid-metal panel's face. A class rather than utility gradients so the
   face can follow the theme; the rim shader underneath never changes. */
.liquid-metal-face {
  background-image: var(--panel-face);
  box-shadow: var(--panel-shadow);
}

.liquid-metal-face[data-active="true"] {
  background-image: var(--panel-face-active);
  box-shadow: var(--panel-shadow-active);
}
```

- [ ] **Шаг 5: Проверка** — изменён только CSS со значениями, равными текущим:

Run: `npm run typecheck && npm run lint`, затем
`node snapshot.mjs compare baseline-dark.json`
Expected: `PASS`, `allowedCollapses: 0`, `unexpected: 0`.

Если `unexpected > 0` — значит какой-то `rgb(var(--fg-rgb) / α)` вычисляется
иначе, чем прежний `rgba`. Остановиться и разобрать, а не подгонять.

- [ ] **Шаг 6: Коммит**

```bash
git add app/globals.css
git commit -m "refactor: move globals.css colours onto theme tokens"
```

---

### Задача 3: Компоненты на токены

**Файлы:** Изменить: `components/{about,calculation,capabilities,contact,demo,how-it-works,lead-form,section-heading,site-footer}.tsx`,
`components/ui/{liquid-metal-panel,text-field}.tsx`

**Интерфейсы:** Потребляет утилиты и `.liquid-metal-face` из задачи 2.

- [ ] **Шаг 1: Замена по инвентаризации** — скрипт с точной картой:

```python
from pathlib import Path
MAP = {  # class -> semantic utility (spec: "Сведение уровней прозрачности")
  "text-white/60": "text-ink-soft", "text-white/55": "text-ink-soft", "text-white/50": "text-ink-soft",
  "text-white/45": "text-ink-faint", "text-white/40": "text-ink-faint",
  "text-white/30": "text-ink-ghost",
  "border-white/[0.07]": "border-line-soft",
}
files = ["about","calculation","capabilities","contact","demo","how-it-works","lead-form","section-heading","site-footer"]
paths = [Path(f"components/{f}.tsx") for f in files] + [Path("components/ui/text-field.tsx")]
for p in paths:
    t = p.read_text()
    for old, new in MAP.items():
        t = t.replace(old, new)
    p.write_text(t)
left = [str(p) for p in paths if any(k in p.read_text() for k in MAP)]
assert not left, left
```

- [ ] **Шаг 2: Заголовок героя и подсветка** — в `components/demo.tsx`:
  - `bg-[linear-gradient(145deg,#fff_8%,#d4d4ce_53%,#777b79_100%)]` → `bg-[image:var(--hero-title)]`
  - `fill="#c7a7ff"` → `fill="var(--spotlight)"`

- [ ] **Шаг 3: Лицо карточки** — в `components/ui/liquid-metal-panel.tsx`
  второй `<span>` (лицо) заменить целиком:

```tsx
      <span
        className="liquid-metal-face pointer-events-none absolute inset-[1.5px] z-10 rounded-[inherit] transition-[box-shadow,background-image] duration-300"
        data-active={isActive}
        aria-hidden="true"
      />
```

  Шейдерный `<span>` с металлическим градиентом **не трогать**: металл
  одинаков в обеих темах.

- [ ] **Шаг 4: Проверка**

Run: `npm run typecheck && npm run lint && node snapshot.mjs compare baseline-dark.json`
Expected: `PASS`; `allowedCollapses > 0` (это сведение 50/60→55, 40→45, 7→8);
`unexpected: 0`.

Затем grep: `grep -rnE "text-white/|border-white/" components/ --include=*.tsx | grep -v "liquid-metal-button\|liquid-loader\|dock"`
Expected: пусто.

- [ ] **Шаг 5: Коммит**

```bash
git add components/
git commit -m "refactor: components read colours from semantic tokens"
```

---

### Задача 4: Светлые значения и контраст

**Файлы:** Изменить: `app/globals.css`. Создать: `$SCR/contrast.mjs`.

- [ ] **Шаг 1: Проверка контраста — сначала падает**

`$SCR/contrast.mjs`:

```js
import fs from 'node:fs';
const css = fs.readFileSync(process.argv[2], 'utf8');
const block = css.match(/:root\[data-theme="light"\]\s*\{([\s\S]*?)\n\}/);
if (!block) { console.log('FAIL:\nнет блока :root[data-theme="light"]'); process.exit(1); }
const v = Object.fromEntries([...block[1].matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [m[1], m[2]]));
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const TEXT = ['ink', 'ink-muted', 'ink-soft', 'ink-faint', 'ink-ghost', 'accent', 'danger'];
const fails = []; const rows = [];
for (const t of TEXT) for (const bg of ['canvas', 'surface']) {
  if (!v[t] || !v[bg]) { fails.push(`нет значения --${t} или --${bg}`); continue; }
  const r = ratio(v[t], v[bg]);
  rows.push(`--${t} на --${bg}: ${r.toFixed(2)}`);
  if (r < 4.5) fails.push(`--${t} на --${bg}: ${r.toFixed(2)} < 4.5`);
}
// visual order: in light, more prominent means darker (lower luminance)
const order = ['ink', 'ink-muted', 'ink-soft', 'ink-faint'];
for (let i = 1; i < order.length; i++)
  if (lum(v[order[i]]) < lum(v[order[i - 1]])) fails.push(`порядок заметности нарушен: --${order[i]} темнее --${order[i - 1]}`);
console.log(rows.join('\n'));
if (fails.length) { console.log('FAIL:\n' + fails.join('\n')); process.exit(1); }
console.log('PASS');
```

Run: `node contrast.mjs "/Users/daniilmc/Desktop/Projects/MyTamga website for company/app/globals.css"`
Expected: `FAIL: нет блока :root[data-theme="light"]`.

- [ ] **Шаг 2: Светлый блок** — добавить сразу после последнего `@media (min-width: 1280px) { :root {…} }`:

```css
/* Light: "gallery white". Only values change — every rule that reads a token
   follows automatically. Absence of the attribute is the dark theme. */
:root[data-theme="light"] {
  color-scheme: light;
  --canvas: #f3f1ec;
  --surface: #faf9f6;
  --surface-raised: #ffffff;
  --ink: #151615;
  --ink-muted: #4f514d;
  --ink-soft: #5a5c58;
  --ink-faint: #6b6d68;
  --ink-ghost: #6b6d68;
  --line: #dcd8cf;
  --line-soft: rgb(21 22 21 / 0.09);
  --accent: #6d4fd1;
  --on-accent: #ffffff;
  --danger: #b42318;
  --danger-line: #d92d20;
  --fg-rgb: 21 22 21;
  --scrollbar-track: #ebe8e1;
  --scrollbar-thumb: #c9c5bb;
  --scrollbar-thumb-hover: #aaa69c;
  --hero-title: linear-gradient(145deg, #151615 8%, #3a3c39 53%, #8a8c87 100%);
  --panel-face: linear-gradient(180deg, #ffffff 0%, #faf8f4 60%, #f4f2ed 100%);
  --panel-face-active: linear-gradient(145deg, #f3edff 0%, #f9f6ff 48%, #ffffff 100%);
  --panel-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.95), 0 10px 30px rgba(21, 22, 21, 0.06);
  --panel-shadow-active: inset 0 1px 0 #fff, 0 12px 34px rgba(109, 79, 209, 0.12);
  --canvas-glow: rgba(109, 79, 209, 0.05);
  --scene-glow: rgba(109, 79, 209, 0.12);
  --orbit-line: rgba(109, 79, 209, 0.2);
  --orbit-halo-1: rgba(109, 79, 209, 0.035);
  --orbit-halo-2: rgba(109, 79, 209, 0.02);
  --field-bg: rgba(21, 22, 21, 0.03);
  --field-line: rgba(21, 22, 21, 0.12);
  --spotlight: rgb(109 79 209 / 0.55);
  --shadow-panel: 0 24px 60px rgba(21, 22, 21, 0.14);
}
```

- [ ] **Шаг 3: Контраст проходит**

Run: `node contrast.mjs "/Users/daniilmc/Desktop/Projects/MyTamga website for company/app/globals.css"` → `PASS`, 14 строк ≥ 4.50.

- [ ] **Шаг 4: Тёмная не задета** — `node snapshot.mjs compare baseline-dark.json`
  → `PASS`, `unexpected: 0`.

- [ ] **Шаг 5: Светлая глазами** — снять страницу с принудительным атрибутом:

```js
// $SCR/shot-light.mjs
import { open } from './harness.mjs';
const { browser, page } = await open();
await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
await page.waitForTimeout(3000);
for (const [name, sel] of [['hero', null], ['services', '#services'], ['contacts', '#contacts']]) {
  if (sel) { await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center', behavior: 'instant' }), sel); await page.waitForTimeout(2000); }
  await page.screenshot({ path: `${process.argv[2]}/light-${name}.png` });
}
await browser.close();
```

Проверить на снимках: заголовок героя тёмный, карточки бумажные с хромовой
кромкой, иконки видимы, поля формы различимы, нигде нет белого текста на бумаге.

- [ ] **Шаг 6: Коммит**

```bash
git add app/globals.css
git commit -m "feat: light theme token values"
```

---

### Задача 5: Механизм и переключатель

**Файлы:** Изменить: `app/layout.tsx`, `components/site-header.tsx`.
Создать: `components/theme-toggle.tsx`, `$SCR/toggle.mjs`.

**Интерфейсы:**
- Производит: `ThemeToggle()`; ключ хранилища `"theme"`, значения `"light"` | `"dark"`.

- [ ] **Шаг 1: Проверка — сначала падает**

`$SCR/toggle.mjs`:

```js
import { chromium } from 'playwright-core';
import { open, report } from './harness.mjs';
const URL = process.argv[2] ?? 'http://localhost:3000/';
const fails = [];

// 1. сохранённая светлая стоит на <html> уже к первому кадру — без вспышки
{
  const b = await chromium.launch({ executablePath: process.env.CHROME_EXE });
  const ctx = await b.newContext();
  await ctx.addInitScript(() => {
    try { localStorage.setItem('theme', 'light'); } catch {}
    requestAnimationFrame(() => { window.__firstFrame = document.documentElement.getAttribute('data-theme'); });
  });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: 'load' });
  const first = await p.evaluate(() => window.__firstFrame);
  if (first !== 'light') fails.push(`к первому кадру data-theme="${first}", ожидалось "light" — вспышка`);
  await b.close();
}

// 2. после гидратации атрибут на месте (ловушка Strict Mode в dev)
{
  const { browser, page, errors } = await open({ theme: 'light', url: URL });
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => ({
    theme: document.documentElement.getAttribute('data-theme'),
    pressed: document.querySelector('[data-theme-toggle]')?.getAttribute('aria-pressed'),
    canvas: getComputedStyle(document.body).backgroundColor,
  }));
  if (r.theme !== 'light') fails.push(`после гидратации data-theme="${r.theme}" — атрибут стёрт`);
  if (r.pressed !== 'true') fails.push(`aria-pressed="${r.pressed}" при светлой теме`);
  if (errors.length) fails.push('ошибки: ' + errors.join('; '));
  await browser.close();
}

// 3. клик переключает, выбор переживает перезагрузку, клавиатура работает
{
  const { browser, page, errors } = await open({ url: URL });
  const btn = page.locator('[data-theme-toggle]');
  if (await btn.count() === 0) { fails.push('переключателя нет'); }
  else {
    if (await page.evaluate(() => document.documentElement.getAttribute('data-theme')) !== null)
      fails.push('по умолчанию тема не тёмная');
    await btn.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(400);
    const afterKey = await page.evaluate(() => ({ t: document.documentElement.getAttribute('data-theme'), s: localStorage.getItem('theme') }));
    if (afterKey.t !== 'light' || afterKey.s !== 'light') fails.push(`Enter не включил светлую: ${JSON.stringify(afterKey)}`);
    await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(2500);
    if (await page.evaluate(() => document.documentElement.getAttribute('data-theme')) !== 'light')
      fails.push('выбор не пережил перезагрузку');
    await page.locator('[data-theme-toggle]').click(); await page.waitForTimeout(400);
    const back = await page.evaluate(() => ({ t: document.documentElement.getAttribute('data-theme'), s: localStorage.getItem('theme') }));
    if (back.t !== null || back.s !== 'dark') fails.push(`обратное переключение: ${JSON.stringify(back)}`);
    const name = await page.locator('[data-theme-toggle]').getAttribute('aria-label');
    if (!name) fails.push('у переключателя нет доступного имени');
  }
  if (errors.length) fails.push('ошибки: ' + errors.join('; '));
  await browser.close();
}
report(fails);
```

Run: `node toggle.mjs` → `FAIL` (вспышка, переключателя нет).

- [ ] **Шаг 2: Скрипт в `<head>`** — `app/layout.tsx`, заменить `return (…)`:

```tsx
  return (
    // The inline script adds data-theme before React hydrates; the attribute
    // is absent from the server markup, so the mismatch is expected.
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem("theme")==="light")document.documentElement.setAttribute("data-theme","light")}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <SitePreloader />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
```

- [ ] **Шаг 3: Переключатель** — `components/theme-toggle.tsx`:

> **Поправка при выполнении.** Первая версия ниже держала копию темы в
> `useState` и вызывала `setState` в `useLayoutEffect`. Линт отклонил её
> (`react-hooks/set-state-in-effect`) — и был прав: тема живёт во внешней
> системе, атрибуте на `<html>`. Реализованная версия читает его через
> `useSyncExternalStore` с `MutationObserver` и не вызывает `setState`
> вовсе; `useLayoutEffect` остался только для повторного применения
> атрибута после перемонтирования Strict Mode. Код ниже — исходный план,
> фактический — в `components/theme-toggle.tsx`.

```tsx
"use client";

import { Moon, Sun } from "lucide-react";
import { useLayoutEffect, useState } from "react";

const STORAGE_KEY = "theme";

function readTheme(): "light" | "dark" {
  return document.documentElement.getAttribute("data-theme") === "light"
    ? "light"
    : "dark";
}

function applyTheme(theme: "light" | "dark") {
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

export function ThemeToggle() {
  // Starts as the server renders it (dark) so hydration matches; corrected
  // before paint below.
  const [isLight, setIsLight] = useStoredTheme();

  function toggle() {
    const next = isLight ? "dark" : "light";
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage may be unavailable; the switch still works for this visit.
    }
    setIsLight(next === "light");
  }

  return (
    <button
      type="button"
      data-theme-toggle
      aria-label="Светлая тема"
      aria-pressed={isLight}
      onClick={toggle}
      className="nav-toggle theme-toggle inline-flex h-10 w-10 items-center justify-center"
    >
      {/* Both icons ship; CSS picks one from [data-theme], so the icon never
          depends on React state and never disagrees with the server. */}
      <Sun className="theme-toggle-sun h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden="true" />
      <Moon className="theme-toggle-moon h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden="true" />
    </button>
  );
}

function useStoredTheme() {
  const [isLight, setIsLight] = useState(false);

  useLayoutEffect(() => {
    // Strict Mode's dev-only remount resets <html> to its JSX attributes and
    // drops the one the inline script set. Re-apply it from storage — a no-op
    // in production, where the script's value survives.
    try {
      if (localStorage.getItem(STORAGE_KEY) === "light") {
        applyTheme("light");
      }
    } catch {
      // Storage unavailable: keep whatever the document already has.
    }
    setIsLight(readTheme() === "light");
  }, []);

  return [isLight, setIsLight] as const;
}
```

CSS иконок — в `globals.css` перед `.spline-loader {`:

```css
.theme-toggle-sun {
  display: none;
}

:root[data-theme="light"] .theme-toggle-sun {
  display: block;
}

:root[data-theme="light"] .theme-toggle-moon {
  display: none;
}
```

(Здесь `display` в `globals.css` допустим: он не спорит ни с одной
респонсив-утилитой — у иконок их нет.)

- [ ] **Шаг 4: Хедер** — в `components/site-header.tsx` импортировать
  `ThemeToggle` и обернуть бургер. У бургера убрать `col-start-3` и
  `justify-self-end` — они переезжают на обёртку:

```tsx
          <div className="col-start-3 flex items-center gap-2 justify-self-end">
            <ThemeToggle />
            <button
              ref={toggleRef}
              type="button"
              className="nav-toggle inline-flex h-10 w-10 items-center justify-center md:hidden"
              aria-expanded={isOpen}
              aria-controls="site-nav-mobile"
              aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
              onClick={() => setIsOpen((open) => !open)}
            >
              {isOpen ? (
                <X className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
              )}
            </button>
          </div>
```

Импорт: `import { ThemeToggle } from "@/components/theme-toggle";`

- [ ] **Шаг 5: Проверка в dev** — `node toggle.mjs` → `PASS`.

- [ ] **Шаг 6: Проверка в production** — ловушка Strict Mode отличает dev от сборки:

```bash
npm run build && (npx next start -p 3100 > "$SCR/prod.log" 2>&1 &)
until curl -sf -o /dev/null http://localhost:3100/; do sleep 1; done
node toggle.mjs http://localhost:3100/
pkill -f "next start -p 3100"
git checkout -- next-env.d.ts   # build flips it to prod paths
```

Expected: `PASS`.

- [ ] **Шаг 7: Тёмная не задета вне хедера**

`node snapshot.mjs compare baseline-dark.json --skip-header` → `PASS`, `unexpected: 0`.
(Хедер исключён: в нём появился новый DOM, пути элементов сдвинулись.)

- [ ] **Шаг 8: Коммит**

```bash
git add app/layout.tsx app/globals.css components/theme-toggle.tsx components/site-header.tsx
git commit -m "feat: theme toggle with a no-flash inline script"
```

---

### Задача 6: Регрессия в обеих темах и документация

**Файлы:** Создать: `$SCR/regress.mjs`. Изменить: `DESIGN.md`.

- [ ] **Шаг 1: Регрессия**

`$SCR/regress.mjs`:

```js
import { open, report } from './harness.mjs';
const fails = [];
for (const theme of ['dark', 'light']) for (const width of [1680, 1280, 390]) {
  const { browser, page, errors } = await open({ width, height: width < 500 ? 844 : 900, theme });
  const r = await page.evaluate(() => ({
    theme: document.documentElement.getAttribute('data-theme') ?? 'dark',
    sections: ['hero', 'services', 'how', 'calc', 'about', 'contacts'].filter((id) => !document.getElementById(id)),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    dead: document.querySelectorAll('a[href="#"]').length,
    toggle: !!document.querySelector('[data-theme-toggle]'),
  }));
  const tag = `${theme}@${width}`;
  if (r.theme !== theme) fails.push(`${tag}: применена ${r.theme}`);
  if (r.sections.length) fails.push(`${tag}: нет секций ${r.sections}`);
  if (r.overflow) fails.push(`${tag}: переполнение ${r.overflow}px`);
  if (r.dead) fails.push(`${tag}: мёртвых ссылок ${r.dead}`);
  if (!r.toggle) fails.push(`${tag}: переключателя нет`);
  if (width === 1680) {
    await page.locator('#contacts form button[type=submit]').click();
    await page.waitForTimeout(1500);
    const invalid = await page.evaluate(() => document.querySelectorAll('#contacts [aria-invalid="true"]').length);
    if (invalid !== 3) fails.push(`${tag}: форма — ${invalid} ошибок вместо 3`);
  }
  if (errors.length) fails.push(`${tag}: ${errors.join('; ')}`);
  await browser.close();
}
report(fails);
```

Run: `node regress.mjs` → `PASS` (6 комбинаций).

- [ ] **Шаг 2: DESIGN.md** — добавить раздел `## Themes` перед `## Sections`:

```markdown
## Themes

- Dark is the default and the absence of `data-theme` on `<html>`. Light is
  `:root[data-theme="light"]` — "gallery white", warm paper.
- A synchronous script in `<head>` sets the attribute from `localStorage`
  before first paint. `ThemeToggle` re-applies it in `useLayoutEffect`
  because Strict Mode's dev remount resets `<html>` attributes.
- Every colour that differs between themes is a token. Neutral tints use the
  `--fg-rgb` helper: `rgb(var(--fg-rgb) / a)`.
- The robot, the liquid-metal buttons and the preloader rainbow are the same
  in both themes. Cards keep their shader rim and swap only the face.
- Light text tokens clear 4.5:1 on canvas and surface, and keep the dark
  theme's order of prominence.
```

И в `## Known constraints` добавить пункт:

```markdown
- The theme script is inline, so a strict Content Security Policy without
  `'unsafe-inline'` would block it. Add a nonce if a CSP is ever introduced.
```

- [ ] **Шаг 3: Финальная статика**

Run: `npm run typecheck && npm run lint` → чисто.

- [ ] **Шаг 4: Коммит и пуш**

```bash
git add DESIGN.md
git commit -m "docs: themes chapter"
git push
```
