import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { hasLocale } from "@/lib/i18n/config";
import { pageMetadata } from "@/lib/seo-copy";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { COMPANY } from "@/lib/legal/company";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/support">): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? pageMetadata(lang, "/support") : {};
}

export default async function SupportPage({ params }: PageProps<"/[lang]/support">) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const t = getDictionary(lang);

  return (
    <>
      <main>
        <section
          className="section-anchor w-full px-[var(--gutter)] page-section"
          aria-labelledby="support-title"
        >
          <SectionHeading
            as="h1"
            id="support-title"
            kicker={t.billing.legal.support}
            title={t.billing.legal.supportTitle}
          />
          <div className="section-body prose-page rounded-[1.25rem] border border-line-soft bg-[var(--surface)] p-6 sm:p-8">
            <p className="section-lead text-ink">
              {t.billing.legal.supportBody}
            </p>
            <p className="mt-3 text-base leading-[1.6] text-ink-soft">
              {t.billing.legal.supportHint}
            </p>
            <p className="mt-6 text-xl font-semibold tracking-[-0.01em] sm:text-[1.375rem]">
              <a href={`mailto:${COMPANY.supportEmail}`} className="nav-link text-[var(--accent)]">
                {COMPANY.supportEmail}
              </a>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
