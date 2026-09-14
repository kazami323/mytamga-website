"use client";

import { useEffect, useState } from "react";

import { LiquidLoading } from "@/components/ui/liquid-loader";
import { cn } from "@/lib/utils";
import { isSceneReady, subscribeSceneReady } from "@/lib/scene-ready";

// A deliberate hold: the overlay stays for a full three seconds even when the
// scene resolves sooner.
const MIN_VISIBLE_MS = 3000;
// The scene is fetched from a third party and may never arrive; nothing gets to
// hold the page hostage.
const MAX_VISIBLE_MS = 7000;
const FADE_MS = 500;

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
      {/* Placeholder for the logo once it exists. */}
      <p className="site-brand text-base font-semibold tracking-[-0.02em]">
        MyTamga
      </p>
      <span className="sr-only">{loadingLabel}</span>
    </div>
  );
}
