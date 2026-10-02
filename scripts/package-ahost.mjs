// Готовит архив сайта для общего хостинга ahost (cPanel, «Setup Node.js App»).
//
//   NEXT_PUBLIC_SITE_URL=https://mytamga.uz \
//   MYTAMGA_API_URL=https://api.mytamga.uz \
//   npm run package:ahost
//
// Собирать надо на своём компьютере: на «Микро» не влезут 519 МБ зависимостей,
// а сборке не хватит 1 ГБ памяти. На хостинг уходит готовый пакет — ~66 МБ.
//
// Адреса передаются при сборке, а не потом, по двум причинам:
//   - NEXT_PUBLIC_SITE_URL вшивается в страницы при сборке: из него строятся
//     canonical, hreflang и адрес превью ссылки. Без него они указали бы на
//     localhost.
//   - Страница тарифов собирается заранее и обновляется раз в час. Если API
//     недоступен во время сборки, первый час она покажет «цены недоступны».
//
// Секрет MYTAMGA_API_PROXY_KEY сюда не передаётся и в сборку не попадает: его
// задают в настройках приложения в cPanel.

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const fail = (message) => {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
};

// 1. Боевые адреса. localhost в боевой сборке — это сломанные ссылки и превью.
for (const name of ["NEXT_PUBLIC_SITE_URL", "MYTAMGA_API_URL"]) {
  const value = String(process.env[name] ?? "").trim();
  if (!value) fail(`${name} не задан. Пример — в начале этого файла.`);
  if (!value.startsWith("https://")) fail(`${name} должен начинаться с https:// — сейчас «${value}».`);
  if (/localhost|127\.0\.0\.1/.test(value)) fail(`${name} указывает на этот компьютер: «${value}».`);
}

// 2. API доступен? Не повод останавливаться, но тарифы первый час будут пустыми.
try {
  const response = await fetch(`${process.env.MYTAMGA_API_URL.replace(/\/+$/, "")}/api/billing/plans`, {
    signal: AbortSignal.timeout(8000),
  });
  console.log(response.ok ? "✓ API отвечает — тарифы попадут в сборку." : `! API ответил ${response.status}.`);
} catch {
  console.warn(
    "! API недоступен. Сайт соберётся, но страница тарифов первый час покажет\n" +
      "  «цены временно недоступны» — потом обновится сама.",
  );
}

// 3. Сборка. Переданные адреса сильнее, чем .env.local: Next не переписывает
//    переменные, которые уже заданы в окружении.
execFileSync("npm", ["run", "build"], { cwd: root, stdio: "inherit", env: process.env });

const standalone = join(root, ".next", "standalone");
if (!existsSync(join(standalone, "server.js"))) {
  fail("В .next/standalone нет server.js — проверь output: \"standalone\" в next.config.ts.");
}

// 4. Пакет: сервер + статика + public. Standalone их не копирует сам.
const out = join(root, "dist", "ahost");
rmSync(join(root, "dist"), { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(standalone, out, { recursive: true });
cpSync(join(root, "public"), join(out, "public"), { recursive: true });
cpSync(join(root, ".next", "static"), join(out, ".next", "static"), { recursive: true });

// Локальные .env с адресом localhost на хостинг не едут: настройки там задаются
// в cPanel.
for (const name of readdirSync(out)) {
  if (name.startsWith(".env")) rmSync(join(out, name));
}

const zip = join(root, "dist", "mytamga-site.zip");
// Без оболочки: путь к проекту с пробелами уходит одним аргументом.
execFileSync("zip", ["-qr", zip, "."], { cwd: out });

const count = (dir) =>
  readdirSync(dir, { withFileTypes: true }).reduce(
    (n, entry) => n + (entry.isDirectory() ? count(join(dir, entry.name)) : 1),
    0,
  );

console.log(`
✓ Готово: dist/mytamga-site.zip — ${(statSync(zip).size / 1024 / 1024).toFixed(1)} МБ, ${count(out)} файлов.

Дальше — по шагам из docs/DEPLOY_RU.md: загрузить архив в cPanel,
распаковать в папку приложения и запустить server.js в «Setup Node.js App».
`);
