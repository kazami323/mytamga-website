"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { setTheme, useIsLightTheme } from "@/lib/theme";

type Burst = { id: number; tone: "sun" | "moon" };

/**
 * A pill switch with a sprung thumb and a light burst on toggle.
 *
 * Everything that depends on the theme — colours, shadows, the thumb's
 * position, which icon shows — is decided in CSS from [data-theme]. That
 * attribute is on <html> before first paint, so the switch is drawn in its
 * final position: no placeholder while mounting, and no thumb sliding across
 * on load for someone who chose light last time.
 */
export function CinematicThemeSwitcher() {
  const isLight = useIsLightTheme();
  const shouldReduceMotion = useReducedMotion();
  const [burst, setBurst] = useState<Burst | null>(null);
  const burstTimer = useRef<number | undefined>(undefined);
  const burstId = useRef(0);

  useEffect(() => () => window.clearTimeout(burstTimer.current), []);

  function toggle() {
    const next = isLight ? "dark" : "light";
    setTheme(next);

    if (shouldReduceMotion) {
      return;
    }

    // The burst takes the colour of the theme being switched to.
    setBurst({ id: burstId.current++, tone: next === "light" ? "sun" : "moon" });
    window.clearTimeout(burstTimer.current);
    burstTimer.current = window.setTimeout(() => setBurst(null), 1000);
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isLight}
      aria-label="Светлая тема"
      data-theme-toggle
      onClick={toggle}
      className="cts relative inline-flex h-10 w-[65px] shrink-0 items-center rounded-full border-[1.5px] p-1"
    >
      <span className="cts-groove pointer-events-none absolute inset-[2px] rounded-full" aria-hidden="true" />
      <span className="cts-gloss pointer-events-none absolute inset-0 rounded-full" aria-hidden="true" />
      <span className="cts-occlusion pointer-events-none absolute inset-0 rounded-full" aria-hidden="true" />

      <span className="pointer-events-none absolute inset-0 flex items-center justify-between px-2.5" aria-hidden="true">
        <Sun className="cts-track-sun h-3.5 w-3.5" strokeWidth={2} />
        <Moon className="cts-track-moon h-3.5 w-3.5" strokeWidth={2} />
      </span>

      <span
        data-switch-thumb
        className="cts-thumb relative z-10 flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border"
        aria-hidden="true"
      >
        <span className="cts-thumb-shine pointer-events-none absolute inset-0 rounded-full" />

        <AnimatePresence>
          {burst &&
            [0, 1, 2].map((layer) => (
              <motion.span
                key={`${burst.id}-${layer}`}
                className={`cts-burst-${burst.tone} pointer-events-none absolute h-2.5 w-2.5 rounded-full`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: burst.tone === "moon" ? 6 : 8, opacity: [0, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: burst.tone === "moon" ? 0.5 : 0.6 + layer * 0.1,
                  delay: layer * 0.1,
                  ease: "easeOut",
                }}
              />
            ))}
        </AnimatePresence>

        <Sun className="cts-thumb-sun relative z-10 h-3.5 w-3.5" strokeWidth={2} />
        <Moon className="cts-thumb-moon relative z-10 h-3.5 w-3.5" strokeWidth={2} />
      </span>
    </button>
  );
}
