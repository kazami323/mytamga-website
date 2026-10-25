import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LimitsTable } from "@/components/pricing/limits-table";
import { PlanGrid } from "@/components/pricing/plan-grid";
import { CheckoutPanel } from "@/components/pricing/checkout-panel";
import { PeriodToggle } from "@/components/pricing/period-toggle";
import { PricingProvider } from "@/components/pricing/pricing-provider";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { AUTORENEW_AVAILABLE, PRICES_PUBLISHED } from "@/lib/billing/flags";
import { isCatalogUsable } from "@/lib/billing/catalog";
import { loadPlans, loadProviders } from "@/lib/billing/plans.server";
import { JsonLd } from "@/components/json-ld";
import { APP_LINKS } from "@/lib/app-links";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { highestPlanPrice, mobileApplicationJsonLd } from "@/lib/seo";
import { pageMetadata } from "@/lib/seo-copy";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/pricing">): Promise<Metadata> {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    return {};
  }

  return pageMetadata(lang, "/pricing");
}

export default async function PricingPage({ params }: PageProps<"/[lang]/pricing">) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const t = getDictionary(lang);
  const [plans, providers] = await Promise.all([loadPlans(), loadProviders()]);

  return (
    <>
      <JsonLd
        data={mobileApplicationJsonLd({
          googlePlay: APP_LINKS.googlePlay,
          highPrice: PRICES_PUBLISHED && isCatalogUsable(plans) ? highestPlanPrice(plans) : null,
        })}
      />
      <main>
        <section
          id="pricing"
          className="section-anchor w-full px-[var(--gutter)] page-section"
          aria-labelledby="pricing-title"
        >
          <SectionHeading
            as="h1"
            id="pricing-title"
            kicker={t.billing.kicker}
            title={t.billing.title}
          />

          <p className="section-lead mt-6 max-w-[65ch] text-ink-soft">
            {t.billing.lead}
          </p>

          {/* Каталог недоступен — говорим прямо. Цены из кода не берём: устаревшая
              цена разошлась бы со списанием, а это хуже её отсутствия. */}
          {!isCatalogUsable(plans) && (
            <p
              data-catalog="unavailable"
              className="section-body max-w-xl text-base leading-[1.6] text-ink-soft"
            >
              {t.billing.catalogUnavailable}
            </p>
          )}

          {isCatalogUsable(plans) && plans !== null && (
            <PricingProvider>
              {/* Пока цены не объявлены, сравнивать нечего. */}
              {PRICES_PUBLISHED && (
                <div className="section-body">
                  <PeriodToggle strings={t.billing.period} />
                </div>
              )}

              <PlanGrid plans={plans} strings={t.billing} locale={lang} />

              <LimitsTable plans={plans} strings={t.billing} locale={lang} />

              <p className="mt-10 text-[0.8125rem] leading-5 text-ink-faint">
                {AUTORENEW_AVAILABLE ? t.billing.renewAuto : t.billing.renewManual}
              </p>

              <CheckoutPanel
                strings={t.billing}
                locale={lang}
                providers={providers ?? []}
                plans={plans}
              />
            </PricingProvider>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
