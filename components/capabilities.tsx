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
      className="section-anchor w-full px-[var(--gutter)] section section-alt"
      aria-labelledby="capabilities-title"
    >
      <p className="hero-kicker">
        {strings.kicker}
      </p>

      <h2
        id="capabilities-title"
        className="max-w-3xl text-[1.875rem] font-semibold leading-[1.12] tracking-[-0.035em] text-[var(--ink)] sm:text-[2.25rem] lg:text-[clamp(2.5rem,3.2vw,2.875rem)]"
      >
        {strings.title}
      </h2>

      <ul className="section-body grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
              innerClassName="flex h-full flex-col px-6 pb-7 pt-7"
            >
              <Icon
                className="h-6 w-6 text-[var(--accent)]"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <h3 className="mt-7 text-[1.1875rem] font-semibold leading-snug tracking-[-0.01em] text-[var(--ink)]">
                {title}
              </h3>
              <p className="mt-3 text-base leading-[1.6] text-ink-soft">{body}</p>
            </LiquidMetalPanel>
          </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
