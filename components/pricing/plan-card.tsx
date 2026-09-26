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
        {/* «В процессе обсуждения» — только там, где сумма действительно есть и
            её ещё не объявили. Бесплатный тариф ничего не обсуждает, а тариф по
            заявке считается по договору: написать про них «обсуждается» значит
            сказать неправду. */}
        {plan.isRequestOnly && (
          <p className="text-sm font-semibold text-[var(--ink)]">
            {PRICES_PUBLISHED && plan.priceMonthlyFrom
              ? fill(strings.fromMonthly, { amount: groupDigits(plan.priceMonthlyFrom) })
              : strings.byRequest}
          </p>
        )}

        {!plan.isRequestOnly && plan.priceMonthly === 0 && (
          <>
            <p className="text-2xl font-semibold tracking-[-0.02em] text-[var(--ink)] [font-variant-numeric:tabular-nums]">
              {strings.free}
            </p>
            <p className="mt-2 text-xs leading-5 text-ink-faint">
              {strings.freeForever}
            </p>
          </>
        )}

        {!plan.isRequestOnly && plan.priceMonthly > 0 && !PRICES_PUBLISHED && (
          <p className="text-sm font-semibold text-[var(--accent)]">
            {strings.pricePending}
          </p>
        )}

        {!plan.isRequestOnly && plan.priceMonthly > 0 && PRICES_PUBLISHED && (
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
