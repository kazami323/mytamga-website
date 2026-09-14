interface SectionHeadingProps {
  id: string;
  kicker: string;
  title: string;
}

export function SectionHeading({ id, kicker, title }: SectionHeadingProps) {
  return (
    <>
      <p className="section-kicker mb-7 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-ink-faint sm:text-xs">
        {kicker}
      </p>
      <h2
        id={id}
        className="max-w-3xl text-[clamp(1.6rem,4.5vw,2.1rem)] font-semibold leading-[1.12] tracking-[-0.035em] text-[var(--ink)] lg:text-[clamp(2rem,2.6vw,3rem)]"
      >
        {title}
      </h2>
    </>
  );
}
