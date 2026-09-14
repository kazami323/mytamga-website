import { SectionHeading } from "@/components/section-heading";
import { LiquidMetalPanel } from "@/components/ui/liquid-metal-panel";
import { Reveal } from "@/components/ui/reveal";
import { calculation } from "@/lib/content";

export function Calculation() {
  return (
    <section
      id="calc"
      className="section-anchor w-full px-[var(--gutter)] py-24 lg:py-36"
      aria-labelledby="calc-title"
    >
      <SectionHeading
        id="calc-title"
        kicker={calculation.kicker}
        title={calculation.title}
      />

      <ul className="mt-14 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {calculation.inputs.map((input, index) => (
          <li key={input.id} className="flex" data-calc-input>
            <Reveal className="w-full" delay={index * 0.08}>
              <LiquidMetalPanel
                className="h-full w-full"
                innerClassName="flex h-full flex-col px-7 pb-9 pt-8"
              >
                <h3 className="text-base font-semibold tracking-[-0.01em] text-[var(--ink)]">
                  {input.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-ink-soft">
                  {input.body}
                </p>
              </LiquidMetalPanel>
            </Reveal>
          </li>
        ))}
      </ul>

      <p className="section-kicker mb-7 mt-20 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-ink-faint sm:text-xs">
        {calculation.resultKicker}
      </p>

      <ul className="grid gap-10 sm:grid-cols-3 sm:gap-6">
        {calculation.results.map((result, index) => (
          <li key={result.id} data-calc-result>
            <Reveal delay={index * 0.08}>
              <h3 className="text-base font-semibold tracking-[-0.01em] text-[var(--ink)]">
                {result.title}
              </h3>
              <p className="mt-3 max-w-xs text-sm leading-6 text-ink-soft">
                {result.body}
              </p>
            </Reveal>
          </li>
        ))}
      </ul>

      <a
        href="#contacts"
        className="nav-link mt-14 inline-block text-sm font-semibold"
      >
        {calculation.cta} →
      </a>
    </section>
  );
}
