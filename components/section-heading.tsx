interface SectionHeadingProps {
  id: string;
  kicker: string;
  title: string;
  /** Главный заголовок страницы — h1; в разделах главной остаётся h2. */
  as?: "h1" | "h2";
}

export function SectionHeading({ id, kicker, title, as: Heading = "h2" }: SectionHeadingProps) {
  return (
    <>
      <p className="section-kicker">
        {kicker}
      </p>
      <Heading
        id={id}
        className="max-w-3xl text-[1.875rem] font-semibold leading-[1.12] tracking-[-0.035em] text-[var(--ink)] sm:text-[2.25rem] lg:text-[clamp(2.5rem,3.2vw,2.875rem)]"
      >
        {title}
      </Heading>
    </>
  );
}
