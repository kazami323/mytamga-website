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
      className="lss relative inline-flex h-11 w-[220px] shrink-0 rounded-full border-[1.5px] p-1"
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
            className="lss-link flex h-full w-full cursor-pointer items-center justify-center rounded-full text-sm font-semibold tracking-[0.02em]"
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
