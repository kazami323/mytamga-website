"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type BillingPeriod = "monthly" | "yearly";

type PricingState = {
  period: BillingPeriod;
  setPeriod: (period: BillingPeriod) => void;
  selected: string | null;
  select: (planKey: string) => void;
};

const PricingContext = createContext<PricingState | null>(null);

/**
 * Тонкая клиентская оболочка вокруг серверной разметки: состояние здесь,
 * а карточки с ценами остаются серверными и попадают в HTML.
 */
export function PricingProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [selected, setSelected] = useState<string | null>(null);

  const value = useMemo<PricingState>(
    () => ({ period, setPeriod, selected, select: setSelected }),
    [period, selected],
  );

  return (
    <PricingContext.Provider value={value}>
      {/* Период открыт разметке атрибутом: цены прячет CSS, без повторного
          рендера серверных карточек. */}
      <div data-period={period}>{children}</div>
    </PricingContext.Provider>
  );
}

export function usePricing(): PricingState {
  const value = useContext(PricingContext);

  if (!value) {
    throw new Error("usePricing must be used inside PricingProvider");
  }

  return value;
}
