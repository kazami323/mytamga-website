import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Компактная сборка для общего хостинга: в .next/standalone попадают только
  // файлы, которые реально нужны серверу, — 66 МБ и ~1 600 файлов вместо
  // 519 МБ и 26 000 в node_modules. На тарифе «Микро» диск 1 ГБ и лимит
  // 50 000 файлов. Разработку это не меняет. Сборку упаковывает
  // `npm run package:ahost`.
  output: "standalone",
};

export default nextConfig;
