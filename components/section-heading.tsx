interface SectionHeadingProps {
  id: string;
  kicker: string;
  title: string;
}

export function SectionHeading({ id, kicker, title }: SectionHeadingProps) {
  return (
    <>
      <p className="section-kicker">
        {kicker}
      </p>
      <h2
        id={id}
        className="max-w-3xl text-[1.875rem] font-semibold leading-[1.12] tracking-[-0.035em] text-[var(--ink)] sm:text-[2.25rem] lg:text-[clamp(2.5rem,3.2vw,2.875rem)]"
      >
        {title}
      </h2>
    </>
  );
}
