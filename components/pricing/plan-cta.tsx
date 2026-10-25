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
      className="liquid-metal-trigger mt-8 inline-flex h-11 items-center justify-center rounded-full border border-line px-6 text-base font-semibold text-[var(--ink)] transition-colors hover:border-[var(--accent)]"
      onClick={() => select(planKey)}
    >
      {label}
    </a>
  );
}
