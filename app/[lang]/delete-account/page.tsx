import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { hasLocale } from "@/lib/i18n/config";
import { pageMetadata } from "@/lib/seo-copy";
import { COMPANY } from "@/lib/legal/company";
import { DELETE_ACCOUNT } from "@/lib/legal/delete-account";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/delete-account">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return pageMetadata(lang, "/delete-account");
}

export default async function DeleteAccountPage({
  params,
}: PageProps<"/[lang]/delete-account">) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const content = DELETE_ACCOUNT[lang];

  return (
    <>
      <main>
        <section
          className="section-anchor w-full px-[var(--gutter)] page-section"
          aria-labelledby="delete-account-title"
        >
          <SectionHeading
            as="h1"
            id="delete-account-title"
            kicker={content.linkLabel}
            title={content.title}
          />
          <div className="section-body prose-page flex flex-col gap-5">
            <p className="section-lead text-ink-soft">{content.intro}</p>
            {content.sections.map((section) => (
              <div key={section.heading} className="flex flex-col gap-3">
                <h2 className="mt-6 text-[1.3125rem] font-semibold leading-snug tracking-[-0.01em] text-[var(--ink)]">
                  {section.heading}
                </h2>
                {section.steps && (
                  <ol className="flex list-decimal flex-col gap-2.5 pl-6 marker:text-[var(--accent)]">
                    {section.steps.map((step) => (
                      <li key={step} className="text-base leading-[1.6] text-ink-soft">
                        {step}
                      </li>
                    ))}
                  </ol>
                )}
                {section.items && (
                  <ul className="flex list-disc flex-col gap-2.5 pl-6 marker:text-[var(--accent)]">
                    {section.items.map((item) => (
                      <li key={item} className="text-base leading-[1.6] text-ink-soft">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
                {section.paragraphs?.map((text) => (
                  <p key={text} className="text-base leading-[1.6] text-ink-soft">
                    {text}
                  </p>
                ))}
                {section.mail && (
                  <p className="text-lg font-semibold leading-[1.6]">
                    <a href={`mailto:${COMPANY.supportEmail}`} className="nav-link">
                      {COMPANY.supportEmail}
                    </a>
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
