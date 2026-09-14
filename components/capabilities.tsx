"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Calculator,
  FileCheck2,
  ScanBarcode,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { LiquidMetalPanel } from "@/components/ui/liquid-metal-panel";

type Capability = {
  id: string;
  title: string;
  body: string;
  icon: LucideIcon;
};

const CAPABILITIES: Capability[] = [
  {
    id: "code",
    title: "Код ТН ВЭД",
    body: "Определяем код товарной номенклатуры по описанию товара, его составу и назначению.",
    icon: ScanBarcode,
  },
  {
    id: "payments",
    title: "Расчёт платежей",
    body: "Считаем таможенные платежи заранее, чтобы стоимость ввоза была известна до подачи декларации.",
    icon: Calculator,
  },
  {
    id: "requirements",
    title: "Требования к товару",
    body: "Проверяем, какие разрешительные документы нужны именно вашему товару.",
    icon: ShieldCheck,
  },
  {
    id: "documents",
    title: "Подготовка документов",
    body: "Собираем пакет, который останется передать декларанту для дальнейшего оформления.",
    icon: FileCheck2,
  },
];

export function Capabilities() {
  const shouldReduceMotion = useReducedMotion();

  // Reduced motion keeps the reveal but drops the travel, so nothing slides.
  const rise = shouldReduceMotion ? 0 : 28;

  return (
    <section
      id="services"
      className="section-anchor w-full px-[var(--gutter)] py-24 lg:py-36"
      aria-labelledby="capabilities-title"
    >
      <p className="hero-kicker mb-7 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-ink-faint sm:text-xs">
        Возможности
      </p>

      <h2
        id="capabilities-title"
        className="max-w-3xl text-[clamp(1.6rem,4.5vw,2.1rem)] font-semibold leading-[1.12] tracking-[-0.035em] text-[var(--ink)] lg:text-[clamp(2rem,2.6vw,3rem)]"
      >
        Всё, что нужно до подачи декларации
      </h2>

      <ul className="mt-14 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CAPABILITIES.map(({ id, title, body, icon: Icon }, index) => (
          <motion.li
            key={id}
            className="flex"
            initial={{ opacity: 0, y: rise }}
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
        ))}
      </ul>
    </section>
  );
}
