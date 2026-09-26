"use client";

import { useCallback, useEffect, useState } from "react";

import { usePricing } from "@/components/pricing/pricing-provider";
import { LiquidMetalPanel } from "@/components/ui/liquid-metal-panel";
import { TextField } from "@/components/ui/text-field";
import { getJson, postJson, type ApiResult } from "@/lib/api/client";
import type { BillingProvider } from "@/lib/billing/catalog";
import { checkoutActions, type CheckoutBlock } from "@/lib/billing/checkout-state";
import { PRICES_PUBLISHED } from "@/lib/billing/flags";
import { messageFor } from "@/lib/billing/messages";
import type { SubscriptionView } from "@/lib/billing/subscription";
import { HTML_LANG, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";
import { fill } from "@/lib/i18n/interpolate";

interface CheckoutPanelProps {
  strings: Dictionary["billing"];
  locale: Locale;
  providers: BillingProvider[];
}

type Session = "unknown" | "anonymous" | "signed";

export function CheckoutPanel({ strings, locale, providers }: CheckoutPanelProps) {
  const { selected } = usePricing();
  const [session, setSession] = useState<Session>("unknown");
  const [subscription, setSubscription] = useState<SubscriptionView | null>(null);
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const online = providers.filter((provider) => provider.online);
  const [provider, setProvider] = useState(online[0]?.key ?? "");

  // На en и zh оплата всё равно требует узбекского номера: так устроен сервер
  // приложения, и молчать об этом значит вести человека в тупик.
  const needsUzNotice = locale === "en" || locale === "zh";

  /**
   * `signed` — подписка прочитана. `signedOut` — сессии нет. `failed` — сервер
   * не ответил, но куки могут быть живы: решает вызывающий, потому что после
   * успешного входа выбрасывать человека на ввод номера нельзя.
   */
  const applySubscription = useCallback(
    (
      result: ApiResult<{ subscription: SubscriptionView }>,
    ): "signed" | "signedOut" | "failed" => {
      if (result.ok) {
        setSubscription(result.subscription);
        setSession("signed");
        return "signed";
      }

      if (result.code === "signedOut" || result.code === "noOrganization") {
        setSubscription(null);
        setSession("anonymous");
        return "signedOut";
      }

      setSubscription(null);
      setError(messageFor(result.code, result.retryAfter, strings.errors));
      return "failed";
    },
    // Словарь приходит из серверного компонента и по ссылке не меняется.
    [strings.errors],
  );

  async function loadSubscription() {
    return applySubscription(
      await getJson<{ subscription: SubscriptionView }>("/api/subscription"),
    );
  }

  // Человек мог войти раньше: куки живут дольше страницы. Состояние ставится из
  // колбэка запроса, а не в теле эффекта: синхронный setState там вызывает
  // каскад перерисовок, и правило React Compiler его не пропускает. Флаг живости
  // заодно не даёт тронуть состояние после размонтирования.
  useEffect(() => {
    let alive = true;

    void getJson<{ subscription: SubscriptionView }>("/api/subscription").then((result) => {
      if (!alive) {
        return;
      }

      // На монтировании неизвестно, вошёл ли человек: показываем ввод номера,
      // но с объяснением, а не молча.
      if (applySubscription(result) === "failed") {
        setSession("anonymous");
      }
    });

    return () => {
      alive = false;
    };
  }, [applySubscription]);

  async function act(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  const requestCode = () =>
    act(async () => {
      const result = await postJson("/api/session/request-code", { phone });

      if (!result.ok) {
        setError(messageFor(result.code, result.retryAfter, strings.errors));
        return;
      }

      setStep("code");
    });

  const verifyCode = () =>
    act(async () => {
      const result = await postJson("/api/session/verify-code", { phone, code });

      if (!result.ok) {
        setError(messageFor(result.code, result.retryAfter, strings.errors));
        return;
      }

      setCode("");

      // Вход только что удался, куки выставлены. Если подписка не прочиталась,
      // человек всё равно вошёл — возвращать его к вводу номера неправильно.
      if ((await loadSubscription()) === "failed") {
        setSession("signed");
      }
    });

  const pay = () =>
    act(async () => {
      const result = await postJson<{ url: string }>("/api/checkout", {
        planKey: selected,
        provider,
      });

      if (!result.ok) {
        setError(messageFor(result.code, result.retryAfter, strings.errors));
        return;
      }

      window.location.assign(result.url);
    });

  const requestPlan = () =>
    act(async () => {
      const result = await postJson("/api/upgrade-request", { planKey: selected });

      if (!result.ok) {
        setError(messageFor(result.code, result.retryAfter, strings.errors));
        return;
      }

      setNotice(strings.checkout.requestSent);
    });

  const signOut = () =>
    act(async () => {
      await postJson("/api/session/logout", {});
      setSubscription(null);
      setSession("anonymous");
      setStep("phone");
    });

  const until =
    subscription?.nextBillingAt &&
    new Intl.DateTimeFormat(HTML_LANG[locale], { dateStyle: "long" }).format(
      new Date(subscription.nextBillingAt),
    );

  // Что предлагаем и почему — решает проверенная функция, а не цепочка
  // тернарников в разметке: привести человека в тупик здесь слишком легко.
  const { block, canPay, canRequest } = checkoutActions({
    pricesPublished: PRICES_PUBLISHED,
    subscription,
    onlineProviders: online.length,
  });

  const BLOCK_TEXT: Record<Exclude<CheckoutBlock, null>, string> = {
    storeManaged: strings.checkout.storeManaged,
    ownerOnly: strings.checkout.ownerOnly,
    pricesPending: strings.checkout.pricesPending,
    noProvider: strings.errors.unavailable,
  };

  const blocked = block === null ? null : BLOCK_TEXT[block];

  return (
    <section
      id="checkout"
      data-checkout
      data-session={session}
      className="section-anchor mt-20 max-w-xl"
      aria-labelledby="checkout-title"
    >
      <LiquidMetalPanel innerClassName="flex flex-col gap-5 px-7 pb-9 pt-8">
        <h3
          id="checkout-title"
          className="text-base font-semibold tracking-[-0.01em] text-[var(--ink)]"
        >
          {strings.checkout.title}
        </h3>

        {needsUzNotice && (
          <p className="text-sm leading-6 text-ink-soft">
            {strings.checkout.uzPhoneOnly}
          </p>
        )}

        {session !== "signed" && step === "phone" && (
          <>
            <TextField
              id="checkout-phone"
              name="phone"
              type="tel"
              label={strings.checkout.phoneLabel}
              placeholder={strings.checkout.phoneHint}
              autoComplete="tel"
              value={phone}
              onValueChange={setPhone}
            />
            <button
              type="button"
              data-action="request-code"
              disabled={busy}
              onClick={requestCode}
              className="liquid-metal-trigger inline-flex h-11 items-center justify-center rounded-full border border-line px-6 text-sm font-semibold text-[var(--ink)]"
            >
              {strings.checkout.sendCode}
            </button>
          </>
        )}

        {session !== "signed" && step === "code" && (
          <>
            <TextField
              id="checkout-code"
              name="code"
              type="text"
              label={strings.checkout.codeLabel}
              placeholder={strings.checkout.codeHint}
              autoComplete="one-time-code"
              value={code}
              onValueChange={setCode}
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                data-action="verify-code"
                disabled={busy}
                onClick={verifyCode}
                className="liquid-metal-trigger inline-flex h-11 items-center justify-center rounded-full border border-line px-6 text-sm font-semibold text-[var(--ink)]"
              >
                {strings.checkout.confirm}
              </button>
              <button
                type="button"
                onClick={() => setStep("phone")}
                className="nav-link text-sm"
              >
                {strings.checkout.changeNumber}
              </button>
            </div>
          </>
        )}

        {session === "signed" && subscription && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-ink-soft">
              {strings.checkout.currentPlan}: {subscription.planLabel}
            </p>
            {until && (
              <p className="text-xs text-ink-faint">
                {fill(strings.checkout.until, { date: until })}
              </p>
            )}
          </div>
        )}

        {session === "signed" && online.length > 1 && canPay && (
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm text-ink-soft">{strings.providers.label}</legend>
            {online.map((entry) => (
              <label key={entry.key} className="flex items-center gap-2 text-sm text-ink-soft">
                <input
                  type="radio"
                  name="provider"
                  value={entry.key}
                  checked={provider === entry.key}
                  onChange={() => setProvider(entry.key)}
                />
                {entry.label}
              </label>
            ))}
          </fieldset>
        )}

        {session === "signed" && (
          <div className="flex flex-wrap items-center gap-3">
            {canPay && (
              <button
                type="button"
                data-action="pay"
                disabled={busy || !selected}
                onClick={pay}
                className="liquid-metal-trigger inline-flex h-11 items-center justify-center rounded-full border border-line px-6 text-sm font-semibold text-[var(--ink)]"
              >
                {strings.checkout.pay}
              </button>
            )}

            {canRequest && (
              <button
                type="button"
                data-action="request-plan"
                disabled={busy || !selected}
                onClick={requestPlan}
                className="liquid-metal-trigger inline-flex h-11 items-center justify-center rounded-full border border-line px-6 text-sm font-semibold text-[var(--ink)]"
              >
                {strings.cta.request}
              </button>
            )}

            <button type="button" onClick={signOut} className="nav-link text-sm">
              {strings.checkout.signOut}
            </button>
          </div>
        )}

        {blocked !== null && (
          <p data-blocked className="text-sm leading-6 text-ink-soft">
            {blocked}
          </p>
        )}

        <p aria-live="polite" data-checkout-status className="text-sm leading-6 text-ink-soft">
          {error ?? notice}
        </p>
      </LiquidMetalPanel>
    </section>
  );
}
