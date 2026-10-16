import type { BillingPlan } from "@/lib/billing/catalog";
import { groupDigits } from "@/lib/billing/format";
import { LIMIT_LABELS } from "@/lib/billing/label-maps";
import { labelFor } from "@/lib/billing/labels";
import { limitCell, limitRows } from "@/lib/billing/presentation";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";

interface LimitsTableProps {
  plans: BillingPlan[];
  strings: Dictionary["billing"];
  locale: Locale;
}

export function LimitsTable({ plans, strings, locale }: LimitsTableProps) {
  const t = strings.limitsTable;
  const rows = limitRows(plans);

  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="mt-16" aria-labelledby="limits-title">
      <h2
        id="limits-title"
        className="text-lg font-semibold tracking-[-0.01em] text-[var(--ink)]"
      >
        {t.title}
      </h2>

      {/* Прокрутка живёт внутри блока: страница целиком по горизонтали не едет. */}
      <div className="mt-6 max-w-full overflow-x-auto rounded-2xl border border-line-soft">
        <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
          <caption className="sr-only">{t.caption}</caption>
          <thead>
            <tr className="border-b border-line-soft">
              <th
                scope="col"
                className="sticky left-0 z-10 bg-[var(--surface)] px-4 py-3 text-xs font-semibold text-ink-faint"
              >
                {t.limit}
              </th>
              {plans.map((plan) => (
                <th
                  key={plan.key}
                  scope="col"
                  className="px-4 py-3 text-xs font-semibold text-[var(--ink)]"
                >
                  {plan.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-line-soft last:border-b-0">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-[var(--surface)] px-4 py-3 text-sm font-normal text-ink-soft"
                >
                  {labelFor(LIMIT_LABELS[locale], row.key, row.apiLabel)}
                </th>
                {plans.map((plan) => {
                  const cell = limitCell(
                    plan,
                    row.key,
                    plan.limits.find((limit) => limit.key === row.key),
                  );

                  return (
                    <td
                      key={plan.key}
                      className="px-4 py-3 text-ink-soft [font-variant-numeric:tabular-nums]"
                    >
                      {cell.kind === "number" && groupDigits(cell.value)}
                      {cell.kind === "none" && (
                        <>
                          <span aria-hidden="true">{t.none}</span>
                          <span className="sr-only">{t.noneSr}</span>
                        </>
                      )}
                      {cell.kind === "unlimited" && (
                        <>
                          <span aria-hidden="true">{t.unlimited}</span>
                          <span className="sr-only">{t.unlimitedSr}</span>
                        </>
                      )}
                      {cell.kind === "contract" && t.byContract}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
