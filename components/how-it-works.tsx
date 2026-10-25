import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { getCurrentDictionary } from "@/lib/i18n/get-dictionary";

export async function HowItWorks() {
  const { t } = await getCurrentDictionary();
  const howItWorks = t.howItWorks;

  return (
    <section
      id="how"
      className="section-anchor w-full px-[var(--gutter)] section"
      aria-labelledby="how-title"
    >
      <SectionHeading
        id="how-title"
        kicker={howItWorks.kicker}
        title={howItWorks.title}
      />

      <ol className="section-body grid gap-4 sm:grid-cols-3 sm:gap-6">
        {howItWorks.steps.map((step, index) => (
          <li key={step.id} className="flex">
            <Reveal className="w-full" delay={index * 0.08}>
              <div className="h-full rounded-[1.25rem] border border-line-soft bg-[var(--surface)] px-6 pb-8 pt-6 sm:px-7">
              <p
                className="text-[2.75rem] font-semibold leading-none tracking-[-0.03em] text-[var(--accent)] [font-variant-numeric:tabular-nums]"
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-5 text-[1.1875rem] font-semibold leading-snug tracking-[-0.01em] text-[var(--ink)]">
                {step.title}
              </h3>
              <p className="mt-3 text-base leading-[1.6] text-ink-soft">
                {step.body}
              </p>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
