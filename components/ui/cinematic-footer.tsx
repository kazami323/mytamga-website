"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useRef, type PointerEvent, type ReactNode } from "react";


type FooterLink = { label: string; href: string };

type StoreButton = {
  store: "appStore" | "googlePlay";
  /** Название магазина — имя собственное, не переводится. */
  name: string;
  /** Подпись над названием: «Загрузите в» или, пока адреса нет, «Скоро в». */
  caption: string;
  /** null — приложение ещё не опубликовано, кнопка никуда не ведёт. */
  href: string | null;
};

interface CinematicFooterProps {
  /** Имя, набранное контуром во всю ширину за содержимым. */
  brand: string;
  /** Главное утверждение сайта, построчно — каждый язык ломает строки сам. */
  heading: string[];
  /** Бегущая строка: подписи возможностей из словаря, ничего нового. */
  marquee: string[];
  stores: StoreButton[];
  legalLinks: FooterLink[];
  legalNavLabel: string;
  /** Строка реквизитов с годом — её проверяет Click, поэтому она не анимируется. */
  copyright: string;
  backToTop: string;
}

/**
 * Пилюля, которая тянется за курсором. Только для мыши: на пальце притяжение
 * сдвигало бы цель из-под нажатия. С уменьшенным движением — обычная ссылка.
 */
function MagneticLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const shouldReduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  // Пружина с недодемпфированием даёт возврат «с оттяжкой», как elastic.out
  // в исходнике, без отдельной анимационной библиотеки.
  const spring = { stiffness: 180, damping: 14, mass: 0.6 };
  const springX = useSpring(x, spring);
  const springY = useSpring(y, spring);
  const springRotateX = useSpring(rotateX, spring);
  const springRotateY = useSpring(rotateY, spring);

  // Элемент один и тот же при любой настройке: на сервере useReducedMotion ещё
  // не знает её, и ранний возврат обычной ссылки разводил бы разметку сервера и
  // браузера. Уменьшенное движение просто не двигает пилюлю.
  const handleMove = (event: PointerEvent<HTMLAnchorElement>) => {
    if (shouldReduceMotion || event.pointerType !== "mouse") {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const dx = event.clientX - rect.left - rect.width / 2;
    const dy = event.clientY - rect.top - rect.height / 2;
    x.set(dx * 0.4);
    y.set(dy * 0.4);
    rotateX.set(-dy * 0.15);
    rotateY.set(dx * 0.15);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.a
      href={href}
      className={className}
      style={{
        x: springX,
        y: springY,
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformPerspective: 600,
      }}
      whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      {children}
    </motion.a>
  );
}

/** Знаки магазинов в цвете текста — светлая тема перекрашивает их сама. */
function StoreGlyph({ store }: { store: "appStore" | "googlePlay" }) {
  return store === "appStore" ? (
    <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.79 3.59-.76 1.56.04 2.87.67 3.55 1.76-3.13 1.77-2.62 5.92.35 7.14-.65 1.58-1.57 3.1-2.57 4.03zm-3.21-14.7c-.55 1.4-1.89 2.37-3.25 2.28.09-1.5 1.05-2.82 2.38-3.4 1.25-.57 2.66-.41 3.25.04-.15.35-.26.72-.38 1.08z" />
    </svg>
  ) : (
    <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.2 2.6c-.25.26-.4.67-.4 1.2v16.4c0 .53.15.94.4 1.2l.06.06L13.4 12.3v-.2L4.26 2.54l-.06.06zm12.27 12.76L13.4 12.3v-.2l3.07-3.07.07.04 3.63 2.06c1.04.59 1.04 1.55 0 2.14l-3.63 2.06-.07.03zm-.07.04L13.4 12.2l-9.2 9.2c.34.36.9.4 1.53.05l10.67-6.05zm0-6.6L5.73 2.75c-.63-.36-1.19-.31-1.53.05l9.2 9.2 3-3.2z" />
    </svg>
  );
}

/**
 * Подвал-занавес. Обёртка стоит в потоке и обрезана clip-path, подвал под ней
 * закреплён на экране: прокрутка открывает его, как занавес. Параллакс имени и
 * появление содержимого привязаны к прокрутке обёртки.
 */
export function CinematicFooter({
  brand,
  heading,
  marquee,
  stores,
  legalLinks,
  legalNavLabel,
  copyright,
  backToTop,
}: CinematicFooterProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // 0 — верх обёртки коснулся низа экрана, 1 — обёртка открыта целиком.
  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start end", "end end"],
  });

  // Каждый диапазон обязан кончаться на 1. framer-motion переносит прозрачность
  // на ViewTimeline браузера, и после последнего явного кадра WAAPI ведёт
  // значение к исходному inline-стилю — то есть к нулю. С диапазоном до 0.95
  // заголовок проявлялся и снова гас, оставаясь невидимым на открытом подвале.
  const giantY = useTransform(scrollYProgress, [0.2, 1], ["10vh", "0vh"]);
  const giantScale = useTransform(scrollYProgress, [0.2, 1], [0.8, 1]);
  const giantOpacity = useTransform(scrollYProgress, [0.2, 1], [0, 1]);
  const headingY = useTransform(scrollYProgress, [0.55, 1], [50, 0]);
  const headingOpacity = useTransform(scrollYProgress, [0.55, 1], [0, 1]);
  const linksY = useTransform(scrollYProgress, [0.62, 1], [50, 0]);
  const linksOpacity = useTransform(scrollYProgress, [0.62, 1], [0, 1]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: shouldReduceMotion ? "auto" : "smooth" });
  };

  // Бегущая строка повторена дважды: сдвиг на половину ширины замыкает петлю.
  const marqueeRun = (copy: number) => (
    <div key={copy} className="flex items-center gap-12 px-6">
      {marquee.map((item) => (
        <span key={`${copy}-${item}`} className="flex items-center gap-12">
          <span>{item}</span>
          <span className="text-[var(--accent)] opacity-60">✦</span>
        </span>
      ))}
    </div>
  );

  return (
    <div ref={wrapperRef} className="footer-curtain relative h-[100svh] w-full">
      <footer className="footer-stage fixed bottom-0 left-0 flex h-[100svh] w-full flex-col justify-between overflow-hidden">
        <div
          className="footer-aurora pointer-events-none absolute left-1/2 top-1/2 z-0 h-[60vh] w-[80vw] rounded-[50%] blur-[80px]"
          aria-hidden="true"
        />
        <div className="footer-grid pointer-events-none absolute inset-0 z-0" aria-hidden="true" />

        <motion.div
          className="footer-giant footer-reveal pointer-events-none absolute -bottom-[5vh] left-1/2 z-0 -translate-x-1/2 select-none whitespace-nowrap"
          style={{ y: giantY, scale: giantScale, opacity: giantOpacity }}
          aria-hidden="true"
        >
          {brand}
        </motion.div>

        <div
          className="footer-marquee-band absolute left-0 top-24 z-10 w-full -rotate-2 scale-110 overflow-hidden border-y py-3 shadow-2xl sm:py-4 lg:top-[8.5rem]"
          aria-hidden="true"
        >
          <div className="footer-marquee-track flex w-max text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-ink-faint sm:text-xs">
            {marqueeRun(0)}
            {marqueeRun(1)}
          </div>
        </div>

        {/* Центрированный блок не выравнивается по сетке сайта, поэтому без
            --gutter: на широком экране он съедал место, и четвёртая пилюля
            переносилась на отдельную строку. */}
        <div className="relative z-10 mx-auto mt-36 flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 sm:px-10 lg:mt-48">
          <motion.p
            className="footer-reveal mb-10 bg-[image:var(--hero-title)] bg-clip-text text-center font-display text-[clamp(1.5rem,6.6vw,2.75rem)] font-medium leading-[0.98] tracking-[-0.055em] text-transparent sm:mb-12 lg:text-[clamp(2.6rem,4.4vw,5rem)]"
            style={{ y: headingY, opacity: headingOpacity }}
          >
            {heading.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </motion.p>

          <motion.div
            className="footer-reveal flex w-full flex-col items-center gap-5 sm:gap-6"
            style={{ y: linksY, opacity: linksOpacity }}
          >
            <div className="flex w-full flex-wrap justify-center gap-3 sm:gap-4">
              {stores.map((store) => {
                const content = (
                  <>
                    <StoreGlyph store={store.store} />
                    <span className="flex flex-col items-start leading-tight">
                      <span className="text-[0.65rem] font-medium text-ink-faint sm:text-xs">
                        {store.caption}
                      </span>
                      <span className="text-sm font-semibold sm:text-base">{store.name}</span>
                    </span>
                  </>
                );
                const className =
                  "footer-pill flex items-center gap-3 rounded-full px-6 py-3 text-[var(--ink)] sm:px-8 sm:py-4";

                // Без адреса кнопка — не ссылка: ни «#», ни 404 на
                // неопубликованной карточке. Её нельзя ни нажать, ни выбрать
                // табом, а читалка экрана слышит «Скоро в App Store».
                return store.href ? (
                  <MagneticLink key={store.store} href={store.href} className={className}>
                    {content}
                  </MagneticLink>
                ) : (
                  <div key={store.store} data-store-pending className={`${className} cursor-default opacity-70`}>
                    {content}
                  </div>
                );
              })}
            </div>

            <nav aria-label={legalNavLabel} className="w-full">
              <ul className="flex w-full flex-wrap justify-center gap-2 sm:gap-3 md:gap-4">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <MagneticLink
                      href={link.href}
                      className="footer-pill block rounded-full px-4 py-2 text-xs font-medium text-ink-soft sm:px-6 sm:py-3 sm:text-sm"
                    >
                      {link.label}
                    </MagneticLink>
                  </li>
                ))}
              </ul>
            </nav>
          </motion.div>
        </div>

        <div className="relative z-20 flex w-full items-end justify-between gap-6 px-[var(--gutter)] pb-6 sm:pb-8">
          <p className="max-w-3xl text-[0.68rem] leading-5 text-ink-faint sm:text-xs">
            {copyright}
          </p>

          <button
            type="button"
            onClick={scrollToTop}
            aria-label={backToTop}
            title={backToTop}
            className="footer-pill group flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-soft sm:h-12 sm:w-12"
          >
            <svg
              className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>
      </footer>
    </div>
  );
}
