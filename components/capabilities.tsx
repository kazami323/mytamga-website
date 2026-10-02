"use client";

import { motion } from "framer-motion";
import {
  Calculator,
  FileCheck2,
  ScanBarcode,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { LiquidMetalPanel } from "@/components/ui/liquid-metal-panel";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";

// Icons are presentation, so they stay here; the words come from the page's
// dictionary and are matched to an icon by id.
const ICONS: Record<string, LucideIcon> = {
  code: ScanBarcode,
  payments: Calculator,
  requirements: ShieldCheck,
  documents: FileCheck2,
};

export function Capabilities({ strings }: { strings: Dictionary["capabilities"] }) {
  return (
    <section
      id="services"
      className="section-anchor w-full px-[var(--gutter)] py-24 lg:py-36"
      aria-labelledby="capabilities-title"
    >
      <p className="hero-kicker mb-7 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-ink-faint sm:text-xs">
        {strings.kicker}
      </p>

      <h2
        id="capabilities-title"
        className="max-w-3xl text-[clamp(1.6rem,4.5vw,2.1rem)] font-semibold leading-[1.12] tracking-[-0.035em] text-[var(--ink)] lg:text-[clamp(2rem,2.6vw,3rem)]"
      >
        {strings.title}
      </h2>

      <ul className="mt-14 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {strings.items.map(({ id, title, body }, index) => {
          const Icon = ICONS[id] ?? ScanBarcode;
          return (
          <motion.li
            key={id}
            // Reduced motion keeps the fade but drops the travel — in CSS, so
            // the server and client render the same starting frame.
            className="motion-reveal flex"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
          >
            <LiquidMetalPanel
              className="w-full"
              innerClassName="flex h-full flex-col px-7 pb-9 pt-8"
            >
              <Icon
                className="h-5 w-5 text-[var(--accent)]"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <h3 className="mt-7 text-base font-semibold tracking-[-0.01em] text-[var(--ink)]">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-ink-soft">{body}</p>
            </LiquidMetalPanel>
          </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
