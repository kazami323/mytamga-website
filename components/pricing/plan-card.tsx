import { Check } from "lucide-react";

import { PlanCta } from "@/components/pricing/plan-cta";
import { LiquidMetalPanel } from "@/components/ui/liquid-metal-panel";
import { PRICES_PUBLISHED } from "@/lib/billing/flags";
import { yearlySaving, type BillingPlan } from "@/lib/billing/catalog";
import { groupDigits, yearlyMonths } from "@/lib/billing/format";
import { FEATURE_LABELS, PLAN_DESCRIPTIONS } from "@/lib/billing/label-maps";
import { labelFor } from "@/lib/billing/labels";
import { newFeatureKeys, pluralize, teamLineCount } from "@/lib/billing/presentation";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";
import { fill } from "@/lib/i18n/interpolate";

interface PlanCardProps {
  plan: BillingPlan;
  /** Предыдущий тариф в порядке каталога: от него считаются «новые» возможности. */
  previous: BillingPlan | null;
  strings: Dictionary["billing"];
  locale: Locale;
}

export function PlanCard({ plan, previous, strings, locale }: PlanCardProps) {
  const features = FEATURE_LABELS[locale];
  const description = labelFor(PLAN_DESCRIPTIONS[locale], plan.key, plan.description);
  const featureKeys = newFeatureKeys(plan, previous);
  const apiFeatureLabels = new Map(plan.features.map((f) => [f.key, f.label]));
  const teamCount = teamLineCount(plan, previous);
  const months = yearlyMonths(plan.priceMonthly, plan.priceYearly ?? 0);
  const saving = yearlySaving(plan);

  // Кнопка говорит правду о том, что произойдёт: бесплатный тариф не
  // «оформляют», а тариф по заявке и тариф без объявленной цены не покупают.
  const ctaLabel = plan.isRequestOnly
    ? strings.cta.lead
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

      {description && (
        <p className="mt-2 text-sm leading-6 text-ink-soft">{description}</p>
      )}

      <div className="mt-7">
        {/* «В процессе обсуждения» — только там, где сумма действительно есть и
            её ещё не объявили. Бесплатный тариф ничего не обсуждает, а тариф по
            заявке считается по договору: написать про них «обсуждается» значит
            сказать неправду. */}
        {plan.isRequestOnly && (
          <>
            <p className="text-sm font-semibold text-[var(--ink)]">
              {PRICES_PUBLISHED && plan.priceMonthlyFrom
                ? fill(strings.fromMonthly, { amount: groupDigits(plan.priceMonthlyFrom) })
                : strings.byRequest}
            </p>
          </>
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
            {/* Выгода видна только в режиме «год»: в месячном её нет. */}
            {months !== null && (
              <p className="plan-price-yearly mt-2 text-xs leading-5 text-ink-faint">
                {fill(strings.yearlyAs, { months })}
                {saving !== null && ` · ${fill(strings.yearlySaving, { amount: groupDigits(saving) })}`}
              </p>
            )}
          </>
        )}
      </div>

      {plan.trialDays > 0 && (
        <p className="mt-5 text-sm font-semibold text-[var(--accent)]">
          {fill(pluralize(locale, plan.trialDays, strings.trial), { days: plan.trialDays })}
        </p>
      )}

      {plan.extraSeatPriceMonthly !== null && plan.extraSeatPriceMonthly > 0 && PRICES_PUBLISHED && (
        <p className="mt-1 text-xs leading-5 text-ink-faint">
          {fill(strings.extraSeat, { amount: groupDigits(plan.extraSeatPriceMonthly) })}
        </p>
      )}

      <div className="mt-7">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-faint">
          {previous === null || plan.isRequestOnly
            ? strings.includes.title
            : fill(strings.includes.fromPlan, { plan: previous.label })}
        </p>

        <ul className="mt-3 flex flex-col gap-2">
          {(plan.isRequestOnly
            ? [strings.includes.allFeatures, strings.includes.byContract]
            : [
                ...(teamCount !== null
                  ? [fill(pluralize(locale, teamCount, strings.includes.team), { count: teamCount })]
                  : []),
                ...featureKeys.map((key) =>
                  labelFor(features, key, apiFeatureLabels.get(key) ?? ""),
                ),
              ]
          ).map((text) => (
            <li key={text} className="flex items-start gap-2">
              <Check
                className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--accent)]"
                strokeWidth={2}
                aria-hidden="true"
              />
              <span className="text-sm leading-6 text-ink-soft">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto">
        {plan.isRequestOnly ? (
          // Заявка по Enterprise — это письмо в контакты, а не касса: счёт
          // выставляется под компанию. Форма заявки живёт в разделе контактов.
          <a
            href={`/${locale}#contacts`}
            className="liquid-metal-trigger mt-8 inline-flex h-11 items-center justify-center rounded-full border border-line px-6 text-sm font-semibold text-[var(--ink)] transition-colors hover:border-[var(--accent)]"
          >
            {ctaLabel}
          </a>
        ) : (
          <PlanCta planKey={plan.key} label={ctaLabel} />
        )}
      </div>
    </LiquidMetalPanel>
  );
}
