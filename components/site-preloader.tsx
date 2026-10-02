"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { LiquidLoading } from "@/components/ui/liquid-loader";
import { cn } from "@/lib/utils";
import { isSceneReady, subscribeSceneReady } from "@/lib/scene-ready";

// Порог чуть меньше секунды: на тёплом кэше сцена готова почти сразу, и без него
// оверлей мигнул бы, не успев показать загрузку.
const MIN_VISIBLE_MS = 800;
// Потолок: сцена приходит со стороннего CDN и бывает долгой. Таймеры стартуют
// после загрузки скриптов, поэтому от открытия страницы до полностью
// открытого экрана — не больше полутора секунд — если робот не успел, первый
// экран сам показывает «Загрузка сцены», а текст и кнопки уже доступны.
const MAX_VISIBLE_MS = 1000;
// Должно совпадать с transition у .site-preloader в globals.css.
const FADE_MS = 250;

// Module state outlives a soft navigation but not a page load. Changing
// language swaps the [lang] root layout without reloading the document, which
// remounts this overlay; the flag lets it greet a fresh document once and step
// aside on every in-app navigation after that. A head script could not do this:
// it only runs on a full load.
let hasGreetedThisDocument = false;

export function SitePreloader({ loadingLabel }: { loadingLabel: string }) {
  // Read once, at mount: false during hydration (it matches the server), true
  // on a client-side remount, which renders nothing from its first frame.
  const [isDismissed, setIsDismissed] = useState(() => hasGreetedThisDocument);
  const [isUnmounted, setIsUnmounted] = useState(() => hasGreetedThisDocument);

  useEffect(() => {
    // Only read here. Setting it on mount would strand the overlay under
    // Strict Mode: the dev double-run clears these timers, and the second run
    // would see the flag and never start them again.
    if (hasGreetedThisDocument) {
      return;
    }

    const start = performance.now();
    let dismissTimer = 0;

    const dismissAfterFloor = () => {
      const elapsed = performance.now() - start;
      dismissTimer = window.setTimeout(
        () => setIsDismissed(true),
        Math.max(0, MIN_VISIBLE_MS - elapsed),
      );
    };

    const ceilingTimer = window.setTimeout(
      () => setIsDismissed(true),
      MAX_VISIBLE_MS,
    );

    // The scene can finish before this effect runs, so check as well as listen.
    const unsubscribe = subscribeSceneReady(dismissAfterFloor);
    if (isSceneReady()) {
      dismissAfterFloor();
    }

    return () => {
      window.clearTimeout(ceilingTimer);
      window.clearTimeout(dismissTimer);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isDismissed) {
      return;
    }

    // The greeting has happened; later remounts in this document skip it.
    hasGreetedThisDocument = true;

    const timer = window.setTimeout(() => setIsUnmounted(true), FADE_MS);
    return () => window.clearTimeout(timer);
  }, [isDismissed]);

  useEffect(() => {
    if (isUnmounted) {
      return;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [isUnmounted]);

  if (isUnmounted) {
    return null;
  }

  return (
    <div
      className={cn("site-preloader", isDismissed && "site-preloader--done")}
      role="status"
      aria-live="polite"
    >
      <LiquidLoading />
      {/* Знак из приложения рядом с названием — то же сочетание, что в шапке. */}
      <p className="site-brand text-base font-semibold tracking-[-0.02em]">
        <Image
          src="/brand/tamga-symbol.png"
          alt=""
          width={219}
          height={192}
          loading="eager"
          className="h-9 w-auto"
        />
        MyTamga
      </p>
      <span className="sr-only">{loadingLabel}</span>
    </div>
  );
}
