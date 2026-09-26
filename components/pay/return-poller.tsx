"use client";

import { useEffect, useState } from "react";

import { getJson } from "@/lib/api/client";
// Срок опроса компонент не знает и знать не должен: его держит pollOutcome,
// поэтому поведение во времени проверено тестом, а не наблюдением.
import { POLL_INTERVAL_MS, pollOutcome, type PollOutcome } from "@/lib/billing/poll";
import type { SubscriptionView } from "@/lib/billing/subscription";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";
import { COMPANY } from "@/lib/legal/company";
import { fill } from "@/lib/i18n/interpolate";

interface ReturnPollerProps {
  strings: Dictionary["billing"];
  transactionId: string | null;
  expectedPlanKey: string | null;
}

export function ReturnPoller({
  strings,
  transactionId,
  expectedPlanKey,
}: ReturnPollerProps) {
  const [outcome, setOutcome] = useState<PollOutcome>("pending");

  useEffect(() => {
    const startedAt = Date.now();
    let timer: number | undefined;
    let stopped = false;

    async function tick() {
      const result = await getJson<{ subscription: SubscriptionView }>("/api/subscription");
      const elapsedMs = Date.now() - startedAt;

      const next = pollOutcome({
        subscription: result.ok ? result.subscription : null,
        code: result.ok ? null : result.code,
        elapsedMs,
        expectedPlanKey,
      });

      if (stopped) {
        return;
      }

      setOutcome(next);

      if (next === "pending") {
        timer = window.setTimeout(() => void tick(), POLL_INTERVAL_MS);
      }
    }

    void tick();

    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [expectedPlanKey]);

  const message =
    outcome === "success"
      ? strings.pay.success
      : outcome === "signedOut"
        ? strings.pay.signIn
        : outcome === "timeout"
          ? strings.pay.timeout
          : strings.pay.waiting;

  return (
    <div className="mt-8 flex flex-col gap-3">
      <p
        aria-live="polite"
        data-pay-outcome={outcome}
        className="text-sm leading-6 text-[var(--ink)]"
      >
        {message}
      </p>

      {/* Номер платежа нужен, только когда что-то пошло не по плану: с ним
          поддержка найдёт платёж, не переспрашивая. */}
      {transactionId && outcome !== "success" && (
        <p className="text-xs leading-5 text-ink-faint [font-variant-numeric:tabular-nums]">
          {fill(strings.pay.transaction, { id: transactionId })}
        </p>
      )}

      {/* Текст просит написать в поддержку — значит адрес должен быть здесь же. */}
      {outcome !== "success" && outcome !== "pending" && (
        <p data-support className="text-sm leading-6">
          <a href={`mailto:${COMPANY.supportEmail}`} className="nav-link">
            {COMPANY.supportEmail}
          </a>
        </p>
      )}

    </div>
  );
}
