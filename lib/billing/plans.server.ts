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
