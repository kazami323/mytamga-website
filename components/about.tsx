import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { about } from "@/lib/content";

export function About() {
  return (
    <section
      id="about"
      className="section-anchor w-full px-[var(--gutter)] py-24 lg:py-36"
      aria-labelledby="about-title"
    >
      <SectionHeading
        id="about-title"
        kicker={about.kicker}
        title={about.title}
      />

      <Reveal>
        <p className="mt-8 max-w-2xl text-base leading-7 text-ink-soft sm:text-lg sm:leading-8">
          {about.body}
        </p>
      </Reveal>

      <dl className="mt-16 grid gap-10 sm:grid-cols-3 sm:gap-6">
        {about.facts.map((fact, index) => (
          <div key={fact.id} data-about-fact>
            <Reveal delay={index * 0.08}>
              <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-ink-faint">
                {fact.label}
              </dt>
              <dd className="mt-3 text-lg font-semibold tracking-[-0.02em] text-[var(--ink)]">
                {fact.value}
              </dd>
            </Reveal>
          </div>
        ))}
      </dl>
    </section>
  );
}
