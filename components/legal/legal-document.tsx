import { SectionHeading } from "@/components/section-heading";
import { COMPANY, companyFor, missingCompanyFields } from "@/lib/legal/company";
import { DOCUMENTS, type LegalSlug } from "@/lib/legal/documents";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";
import { fill } from "@/lib/i18n/interpolate";

interface LegalDocumentViewProps {
  slug: LegalSlug;
  locale: Locale;
  strings: Dictionary["billing"];
}

export function LegalDocumentView({ slug, locale, strings }: LegalDocumentViewProps) {
  const document = DOCUMENTS[locale]?.[slug];
  const missing = missingCompanyFields();
  const company = companyFor(locale);

  return (
    <section
      className="section-anchor w-full px-[var(--gutter)] page-section"
      aria-labelledby="legal-title"
    >
      <SectionHeading
        id="legal-title"
        kicker={strings.legal[slug]}
        title={document?.title ?? strings.legal[slug]}
      />

      {/* Текста на этом языке нет — не делаем вид, что он есть. */}
      {!document && (
        <div data-legal="translation-missing" className="section-body prose-page">
          <p className="text-base leading-[1.6] text-ink-soft">
            {strings.legal.contractLanguage}
          </p>
          <a href={`/ru/${slug}`} className="nav-link mt-4 inline-block text-base">
            {strings.legal.openRussian}
          </a>
        </div>
      )}

      {document && (
        <>
          <p className="mt-6 text-[0.8125rem] text-ink-faint">
            {fill(strings.legal.updated, { date: document.updated })}
          </p>

          {document.isDraft && (
            <p
              data-legal="draft"
              className="prose-page mt-4 border-l-2 border-[var(--accent)] pl-4 text-base leading-[1.6] text-ink-soft"
            >
              {strings.legal.draftNotice}
            </p>
          )}

          <div className="mt-8 prose-page flex flex-col gap-5">
            {document.blocks.map((block, index) => {
              if (block.kind === "h2") {
                return (
                  <h2
                    key={index}
                    className="mt-6 text-xl font-semibold leading-snug tracking-[-0.01em] text-[var(--ink)]"
                  >
                    {block.text}
                  </h2>
                );
              }

              if (block.kind === "ul") {
                return (
                  <ul key={index} className="flex list-disc flex-col gap-2.5 pl-6 marker:text-[var(--accent)]">
                    {block.items.map((item) => (
                      <li key={item} className="text-base leading-[1.6] text-ink-soft">
                        {item}
                      </li>
                    ))}
                  </ul>
                );
              }

              return (
                <p key={index} className="text-base leading-[1.6] text-ink-soft">
                  {block.text}
                </p>
              );
            })}
          </div>

          {/* Реквизиты требует Click. Пока их нет, страница говорит об этом
              прямо, а не оставляет пустой раздел. */}
          <div className="mt-12 prose-page border-t border-line-soft pt-8">
            <h2 className="text-xl font-semibold tracking-[-0.01em] text-[var(--ink)]">
              {strings.legal.detailsTitle}
            </h2>
            {missing.length > 0 ? (
              <p data-legal="details-missing" className="mt-3 text-base leading-[1.6] text-ink-soft">
                {strings.legal.detailsMissing}
              </p>
            ) : (
              <dl className="mt-3 flex flex-col gap-1 text-base leading-[1.6] text-ink-soft">
                <div>{company.legalName}</div>
                <div>
                  {company.taxLabel} {company.taxId}
                </div>
                <div>{company.address}</div>
                <div>
                  <a href={company.phoneHref} className="nav-link">
                    {company.phone}
                  </a>
                </div>
              </dl>
            )}
            <p className="mt-3 text-base leading-[1.6] text-ink-soft">
              <a href={`mailto:${COMPANY.supportEmail}`} className="nav-link">
                {COMPANY.supportEmail}
              </a>
            </p>
          </div>
        </>
      )}
    </section>
  );
}
