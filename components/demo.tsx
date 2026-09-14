"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

import { Card } from "@/components/ui/card";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";
import { SplineScene } from "@/components/ui/splite";
import { Spotlight } from "@/components/ui/spotlight";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";

export function SplineSceneBasic({ strings }: { strings: Dictionary["hero"] }) {
  const heroRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // The copy is the near plane and travels furthest; the scene sits behind it
  // and lags, which is what reads as depth. Transforms only, so none of this
  // touches the layout the waist crop is aligned against.
  const depth = shouldReduceMotion ? 0 : 1;
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -118 * depth]);
  const sceneY = useTransform(scrollYProgress, [0, 1], [0, -34 * depth]);
  const copyOpacity = useTransform(
    scrollYProgress,
    [0, 0.85],
    [1, shouldReduceMotion ? 1 : 0.2],
  );

  return (
    <section
      ref={heroRef}
      id="hero"
      className="w-full"
      aria-labelledby="hero-title"
    >
      {/* Full bleed: no rim, no radius, no shadow. The composition should read
          as the screen itself, not as a card resting on it. */}
      <Card className="hero-card relative min-h-svh w-full rounded-none border-0 bg-transparent shadow-none [overflow:visible_clip]">
        <Spotlight fill="var(--spotlight)" />

        {/* Grid, not flex: the row height is set by the copy column, so the
            scene cell inherits the exact vertical span of the text. */}
        <div className="relative z-[1] grid min-h-[inherit] grid-rows-[auto_minmax(0,1fr)] gap-y-6 pb-6 pt-24 lg:grid-cols-[1.08fr_0.92fr] lg:grid-rows-none lg:content-center lg:items-stretch lg:gap-y-0 lg:py-16">
          <motion.div
            style={{ y: copyY, opacity: copyOpacity }}
            className="pointer-events-none relative z-10 flex flex-col justify-center px-[var(--gutter)]"
          >
            <p className="hero-kicker mb-7 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-ink-faint sm:text-xs">
              {strings.kicker}
            </p>
            <h1
              id="hero-title"
              className="max-w-4xl bg-[image:var(--hero-title)] bg-clip-text font-display text-[clamp(1.15rem,6vw,2.65rem)] font-medium leading-[0.98] tracking-[-0.055em] text-transparent lg:text-[clamp(2.35rem,3.75vw,4.7rem)]"
            >
              {strings.title.map((line) => (
                <span key={line} className="block whitespace-nowrap">
                  {line}
                </span>
              ))}
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-ink-soft sm:text-lg sm:leading-8">
              {strings.lead}
            </p>
            <div
              className="pointer-events-auto mt-8 flex max-w-xl flex-wrap items-center gap-3 sm:gap-4"
              aria-label={strings.actions}
            >
              <LiquidMetalButton label={strings.contact} />
              <LiquidMetalButton label={strings.learnMore} />
            </div>
          </motion.div>

          <motion.div
            style={{ y: sceneY }}
            className="hero-scene relative z-[1] min-h-[30svh] overflow-visible lg:min-h-0"
          >
            {/* The stage is sized so the robot's waist lands on the cell's
                bottom edge, i.e. flush with the last line of copy. */}
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="hero-stage absolute left-1/2 top-[-1.6%] z-[2] h-[219%] w-auto min-w-full -translate-x-1/2 aspect-[8/3]"
              loadingLabel={strings.sceneLoading}
            />
          </motion.div>
        </div>
      </Card>
    </section>
  );
}
