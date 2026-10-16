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
import { HTML_LANG, LOCALES, hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/pricing">): Promise<Metadata> {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    return {};
  }

  const t = getDictionary(lang);

  return {
    title: t.billing.metaTitle,
    description: t.billing.metaDescription,
    alternates: {
      canonical: `/${lang}/pricing`,
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [HTML_LANG[l], `/${l}/pricing`])),
        "x-default": "/ru/pricing",
      },
    },
  };
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
      <main>
        <section
          id="pricing"
          className="section-anchor w-full px-[var(--gutter)] pb-24 pt-36 lg:pb-36 lg:pt-44"
          aria-labelledby="pricing-title"
        >
          <SectionHeading
            id="pricing-title"
            kicker={t.billing.kicker}
            title={t.billing.title}
          />

          <p className="mt-6 max-w-2xl text-sm leading-6 text-ink-soft">
            {t.billing.lead}
          </p>

          {/* Каталог недоступен — говорим прямо. Цены из кода не берём: устаревшая
              цена разошлась бы со списанием, а это хуже её отсутствия. */}
          {!isCatalogUsable(plans) && (
            <p
              data-catalog="unavailable"
              className="mt-14 max-w-xl text-sm leading-6 text-ink-soft"
            >
              {t.billing.catalogUnavailable}
            </p>
          )}

          {isCatalogUsable(plans) && plans !== null && (
            <PricingProvider>
              {/* Пока цены не объявлены, сравнивать нечего. */}
              {PRICES_PUBLISHED && (
                <div className="mt-10">
                  <PeriodToggle strings={t.billing.period} />
                </div>
              )}

              <PlanGrid plans={plans} strings={t.billing} locale={lang} />

              <LimitsTable plans={plans} strings={t.billing} locale={lang} />

              <p className="mt-10 text-xs leading-5 text-ink-faint">
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
