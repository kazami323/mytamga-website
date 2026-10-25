import { SectionHeading } from "@/components/section-heading";
import { LiquidMetalPanel } from "@/components/ui/liquid-metal-panel";
import { Reveal } from "@/components/ui/reveal";
import { getCurrentDictionary } from "@/lib/i18n/get-dictionary";

export async function Calculation() {
  const { t } = await getCurrentDictionary();
  const calculation = t.calculation;

  return (
    <section
      id="calc"
      className="section-anchor w-full px-[var(--gutter)] section"
      aria-labelledby="calc-title"
    >
      <SectionHeading
        id="calc-title"
        kicker={calculation.kicker}
        title={calculation.title}
      />

      <ul className="section-body grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {calculation.inputs.map((input, index) => (
          <li key={input.id} className="flex" data-calc-input>
            <Reveal className="w-full" delay={index * 0.08}>
              <LiquidMetalPanel
                className="h-full w-full"
                innerClassName="flex h-full flex-col px-6 pb-7 pt-7"
              >
                <h3 className="text-[1.1875rem] font-semibold leading-snug tracking-[-0.01em] text-[var(--ink)]">
                  {input.title}
                </h3>
                <p className="mt-3 text-base leading-[1.6] text-ink-soft">
                  {input.body}
                </p>
              </LiquidMetalPanel>
            </Reveal>
          </li>
        ))}
      </ul>

      <p className="section-kicker mt-14">
        {calculation.resultKicker}
      </p>

      <ul className="grid gap-10 sm:grid-cols-3 sm:gap-6">
        {calculation.results.map((result, index) => (
          <li key={result.id} data-calc-result>
            <Reveal delay={index * 0.08}>
              <h3 className="text-[1.1875rem] font-semibold leading-snug tracking-[-0.01em] text-[var(--ink)]">
                {result.title}
              </h3>
              <p className="mt-3 max-w-sm text-base leading-[1.6] text-ink-soft">
                {result.body}
              </p>
            </Reveal>
          </li>
        ))}
      </ul>

      <a
        href="#contacts"
        className="nav-link mt-10 inline-block text-base font-semibold"
      >
        {calculation.cta} →
      </a>
    </section>
  );
}
