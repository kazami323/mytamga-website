import { PlanCard } from "@/components/pricing/plan-card";
import type { BillingPlan } from "@/lib/billing/catalog";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";

interface PlanGridProps {
  plans: BillingPlan[];
  strings: Dictionary["billing"];
  locale: Locale;
}

export function PlanGrid({ plans, strings, locale }: PlanGridProps) {
  return (
    <ul className="section-body grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {plans.map((plan, index) => (
        <li key={plan.key} className="flex">
          <PlanCard plan={plan} previous={plans[index - 1] ?? null} strings={strings} locale={locale} />
        </li>
      ))}
    </ul>
  );
}
