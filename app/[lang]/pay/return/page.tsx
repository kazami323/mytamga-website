import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { ReturnPoller } from "@/components/pay/return-poller";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { COOKIE } from "@/lib/api/cookies";
import { BASELINE_COOKIE, parseBaseline } from "@/lib/billing/poll";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

// Страница личная: она читает куки и ничего не значит для поисковика.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PayReturnPage({
  params,
}: PageProps<"/[lang]/pay/return">) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const t = getDictionary(lang);
  const jar = await cookies();
  const transactionId = jar.get(COOKIE.transaction)?.value ?? null;
  const paidPlanKey = jar.get(COOKIE.transactionPlan)?.value ?? null;

  // Состояние до оплаты оставила страница тарифов; оно нужно, чтобы продление
  // не засчиталось оплаченным ещё до ответа Click.
  const baseline = parseBaseline(jar.get(BASELINE_COOKIE)?.value);

  return (
    <>
      <main>
        <section
          className="section-anchor w-full px-[var(--gutter)] page-section"
          aria-labelledby="pay-title"
        >
          <SectionHeading
            id="pay-title"
            kicker={t.billing.kicker}
            title={t.billing.pay.title}
          />

          <ReturnPoller
            strings={t.billing}
            transactionId={transactionId}
            // Тариф берётся из куки платежа, а не предполагается: её могло не
            // остаться — человек вернулся через час или с другого устройства — и
            // тогда успехом считается любой платный активный тариф.
            expectedPlanKey={paidPlanKey}
            baseline={baseline}
          />

          <a href={`/${lang}/pricing`} className="nav-link mt-10 inline-block text-base">
            {t.billing.pay.backToPricing}
          </a>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
