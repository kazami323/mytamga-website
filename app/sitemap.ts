import type { MetadataRoute } from "next";

import { LOCALES } from "../lib/i18n/config.ts";
import { INDEXABLE_PATHS, pageUrl, seoLanguages } from "../lib/seo.ts";

const PRIORITY: Record<string, { priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }> = {
  "": { priority: 1, changeFrequency: "weekly" },
  "/pricing": { priority: 0.9, changeFrequency: "weekly" },
  "/support": { priority: 0.5, changeFrequency: "monthly" },
  "/delete-account": { priority: 0.3, changeFrequency: "yearly" },
  "/privacy": { priority: 0.3, changeFrequency: "yearly" },
  "/terms": { priority: 0.3, changeFrequency: "yearly" },
  "/offer": { priority: 0.3, changeFrequency: "yearly" },
};

// Время сборки: страницы статические, выкладка и есть момент изменения.
const BUILT_AT = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  return LOCALES.flatMap((lang) =>
    INDEXABLE_PATHS.map((path) => ({
      url: pageUrl(lang, path),
      lastModified: BUILT_AT,
      ...PRIORITY[path],
      alternates: { languages: seoLanguages(path) },
    })),
  );
}
