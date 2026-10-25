import { LeadForm } from "@/components/lead-form";
import { SectionHeading } from "@/components/section-heading";
import { getCurrentDictionary } from "@/lib/i18n/get-dictionary";

export async function Contact() {
  const { t } = await getCurrentDictionary();
  const contact = t.contact;

  return (
    <section
      id="contacts"
      className="section-anchor w-full px-[var(--gutter)] section"
      aria-labelledby="contacts-title"
    >
      <SectionHeading
        id="contacts-title"
        kicker={contact.kicker}
        title={contact.title}
      />

      <div className="section-body grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <p className="section-lead max-w-md text-ink-soft">
            {contact.body}
          </p>

          <dl className="mt-8 flex flex-col gap-5">
            {contact.channels.map((channel) => (
              <div key={channel.id}>
                <dt className="text-[0.8125rem] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                  {channel.label}
                </dt>
                <dd className="mt-2 text-[1.0625rem] text-[var(--ink)]">
                  {channel.href ? (
                    // Карта — чужой сайт: открываем рядом, а не вместо страницы.
                    // Звонок и письмо уходят в приложения устройства и вкладку
                    // не трогают.
                    <a
                      href={channel.href}
                      className="nav-link"
                      {...(channel.href.startsWith("http")
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
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
