import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { COMPANY } from "@/lib/legal/company";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/support">): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? { title: getDictionary(lang).billing.legal.support } : {};
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
          className="section-anchor w-full px-[var(--gutter)] pb-24 pt-36 lg:pb-36 lg:pt-44"
          aria-labelledby="support-title"
        >
          <SectionHeading
            id="support-title"
            kicker={t.billing.legal.support}
            title={t.billing.legal.supportTitle}
          />
          <p className="mt-8 max-w-xl text-sm leading-6 text-ink-soft">
            {t.billing.legal.supportBody}
          </p>
          <p className="mt-4 text-sm leading-6">
            <a href={`mailto:${COMPANY.supportEmail}`} className="nav-link">
              {COMPANY.supportEmail}
            </a>
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
