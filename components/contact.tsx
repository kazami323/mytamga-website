import { LeadForm } from "@/components/lead-form";
import { SectionHeading } from "@/components/section-heading";
import { getCurrentDictionary } from "@/lib/i18n/get-dictionary";

export async function Contact() {
  const { t } = await getCurrentDictionary();
  const contact = t.contact;

  return (
    <section
      id="contacts"
      className="section-anchor w-full px-[var(--gutter)] py-24 lg:py-36"
      aria-labelledby="contacts-title"
    >
      <SectionHeading
        id="contacts-title"
        kicker={contact.kicker}
        title={contact.title}
      />

      <div className="mt-14 grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <p className="max-w-md text-base leading-7 text-ink-soft">
            {contact.body}
          </p>

          <dl className="mt-10 flex flex-col gap-6">
            {contact.channels.map((channel) => (
              <div key={channel.id}>
                <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-ink-faint">
                  {channel.label}
                </dt>
                <dd className="mt-2 text-base text-[var(--ink)]">
                  {channel.href ? (
                    <a href={channel.href} className="nav-link">
                      {channel.value}
                    </a>
                  ) : (
                    channel.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <LeadForm strings={t.form} />
      </div>
    </section>
  );
}
