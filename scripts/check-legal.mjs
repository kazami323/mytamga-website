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
