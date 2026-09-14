import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { getCurrentDictionary } from "@/lib/i18n/get-dictionary";

export async function HowItWorks() {
  const { t } = await getCurrentDictionary();
  const howItWorks = t.howItWorks;

  return (
    <section
      id="how"
      className="section-anchor w-full px-[var(--gutter)] py-24 lg:py-36"
      aria-labelledby="how-title"
    >
      <SectionHeading
        id="how-title"
        kicker={howItWorks.kicker}
        title={howItWorks.title}
      />

      <ol className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-6">
        {howItWorks.steps.map((step, index) => (
          <li key={step.id}>
            <Reveal delay={index * 0.08}>
              <p
                className="text-sm font-semibold tracking-[0.08em] text-[var(--accent)]"
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-5 text-base font-semibold tracking-[-0.01em] text-[var(--ink)]">
                {step.title}
              </h3>
              <p className="mt-3 max-w-xs text-sm leading-6 text-ink-soft">
                {step.body}
              </p>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
