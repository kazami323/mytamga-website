"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";

import GlowHorizonFM from "@/components/ui/glow-horizon";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";
import { markSceneReady } from "@/lib/scene-ready";

const EASE = [0.16, 1, 0.3, 1] as const;
// Текст появляется, когда горизонт уже почти выехал.
const TEXT_DELAY = 0.7;
const WORD_STEP = 0.07;

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const reveal = (delay: number) => ({
  initial: { opacity: 0, y: 14, filter: "blur(10px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.9, ease: EASE, delay },
});

/**
 * Заголовок по словам: каждое проявляется из размытия с небольшим шагом.
 * Строки сохраняют переносы, которые выбрал каждый язык.
 */
function AnimatedTitle({ lines }: { lines: string[] }) {
  let index = 0;
  return (
    <h1 id="hero-title" className="hero-title">
      {lines.map((line) => (
        <span key={line} className="block">
          {line.split(" ").map((word, i) => {
            const delay = TEXT_DELAY + index++ * WORD_STEP;
            return (
              <motion.span key={`${word}-${i}`} className="inline-block" {...reveal(delay)}>
                {word}
                {i < line.split(" ").length - 1 ? " " : ""}
              </motion.span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}

/**
 * Первый экран: тёмная сцена со светящимся горизонтом сверху и формулировкой
 * сервиса по центру. Тёмный в обеих темах — горизонт рассчитан на чёрный фон.
 */
export function HeroHorizon({ strings }: { strings: Dictionary["hero"] }) {
  // Шрифты и сцена — локальные, ждать нечего: прелоадер может уходить.
  useEffect(() => {
    markSceneReady();
  }, []);

  const words = strings.title.join(" ").split(" ").length;
  const after = TEXT_DELAY + words * WORD_STEP;

  return (
    <section id="hero" className="hero-horizon" aria-labelledby="hero-title">
      <div className="hero-horizon-glow">
        <GlowHorizonFM variant="top" />
      </div>

      <div className="hero-horizon-copy">
        <motion.p className="hero-horizon-kicker" {...reveal(TEXT_DELAY - 0.2)}>
          {strings.kicker}
        </motion.p>
        <AnimatedTitle lines={strings.title} />
        <motion.p className="hero-horizon-lead" {...reveal(after + 0.05)}>
          {strings.lead}
        </motion.p>
        <motion.div
          className="hero-horizon-actions"
          aria-label={strings.actions}
          {...reveal(after + 0.2)}
        >
          <LiquidMetalButton label={strings.contact} onClick={() => scrollToSection("contacts")} />
          <LiquidMetalButton label={strings.learnMore} onClick={() => scrollToSection("about")} />
        </motion.div>
      </div>
    </section>
  );
}
