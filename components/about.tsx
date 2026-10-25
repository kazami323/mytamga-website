import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { getCurrentDictionary } from "@/lib/i18n/get-dictionary";

export async function About() {
  const { t } = await getCurrentDictionary();
  const about = t.about;

  return (
    <section
      id="about"
      className="section-anchor w-full px-[var(--gutter)] section section-alt"
      aria-labelledby="about-title"
    >
      <SectionHeading
        id="about-title"
        kicker={about.kicker}
        title={about.title}
      />

      <Reveal>
        <p className="section-lead mt-6 max-w-[65ch] text-ink-soft">
          {about.body}
        </p>
      </Reveal>

      <dl className="mt-12 grid gap-8 sm:grid-cols-3 sm:gap-6 lg:mt-14">
        {about.facts.map((fact, index) => (
          <div key={fact.id} data-about-fact>
            <Reveal className="flex flex-col-reverse" delay={index * 0.08}>
              <dt className="mt-3 text-[0.9375rem] font-medium leading-snug text-ink-soft">
                {fact.label}
              </dt>
              <dd className="text-[2.75rem] font-semibold leading-none tracking-[-0.03em] text-[var(--accent)] [font-variant-numeric:tabular-nums] lg:text-[3.5rem]">
                {fact.value}
              </dd>
            </Reveal>
          </div>
        ))}
      </dl>
    </section>
  );
}
