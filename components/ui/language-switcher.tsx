"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";

import {
  HTML_LANG,
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_LABEL,
  type Locale,
} from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

// Only an explicit choice is remembered: someone opening a shared /zh link
// shouldn't be greeted in Chinese from then on. Kept outside the component,
// which is not allowed to mutate a global like document.cookie.
function rememberLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

interface LanguageSwitcherProps {
  locale: Locale;
  label: string;
  stretch?: boolean;
  className?: string;
}

/**
 * The theme switch's material and sprung thumb, stretched to four stops.
 *
 * Unlike the theme, the current language is in the URL and so known on the
 * server: the thumb is painted under the right label with no attribute
 * tricks. It is navigation, not a radio group — four real links, each
 * announced in its own language.
 */
export function LanguageSwitcher({
  locale,
  label,
  stretch = false,
  className,
}: LanguageSwitcherProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [target, setTarget] = useState<Locale>(locale);
  const [burst, setBurst] = useState(0);
  const navTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(navTimer.current), []);

  function choose(next: Locale, event: MouseEvent<HTMLAnchorElement>) {
    // New-tab and modified clicks stay ordinary links.
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();

    if (next === locale) {
      return;
    }

    rememberLocale(next);

    // Keep the section the reader was on.
    const href = `/${next}${window.location.hash}`;

    if (shouldReduceMotion) {
      router.push(href);
      return;
    }

    setTarget(next);
    setBurst((count) => count + 1);
    window.clearTimeout(navTimer.current);
    // A beat for the spring to play before the page changes under it.
    navTimer.current = window.setTimeout(() => router.push(href), 220);
  }

  const index = LOCALES.indexOf(target);

  return (
    <nav
      data-lang-switcher
      aria-label={label}
      className={cn(
        "lss relative h-10 shrink-0 rounded-full border-[1.5px] p-1",
        stretch ? "flex w-full" : "inline-flex w-[155px]",
        className,
      )}
      style={{ "--lss-index": index } as CSSProperties}
    >
      <span className="cts-groove pointer-events-none absolute inset-[2px] rounded-full" aria-hidden="true" />
      <span className="cts-gloss pointer-events-none absolute inset-0 rounded-full" aria-hidden="true" />
      <span className="cts-occlusion pointer-events-none absolute inset-0 rounded-full" aria-hidden="true" />

      <span
        data-lang-thumb
        className="lss-thumb pointer-events-none absolute bottom-1 left-1 top-1 overflow-hidden rounded-full border"
        style={{ width: "calc((100% - 8px) / 4)" }}
        aria-hidden="true"
      >
        <span className="cts-thumb-shine pointer-events-none absolute inset-0 rounded-full" />
        <AnimatePresence>
          {burst > 0 &&
            [0, 1, 2].map((layer) => (
              <motion.span
                key={`${burst}-${layer}`}
                className="cts-burst-moon pointer-events-none absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 7, opacity: [0, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55 + layer * 0.1, delay: layer * 0.08, ease: "easeOut" }}
              />
            ))}
        </AnimatePresence>
      </span>

      <ul className="relative z-10 grid h-full w-full grid-cols-4">
        {LOCALES.map((option) => (
          <li key={option} className="flex">
            <a
              href={`/${option}`}
              hrefLang={HTML_LANG[option]}
              lang={HTML_LANG[option]}
              aria-label={LOCALE_LABEL[option].name}
              aria-current={option === locale ? "true" : undefined}
              data-active={option === target}
              onClick={(event) => choose(option, event)}
              className="lss-link flex h-full w-full items-center justify-center rounded-full text-xs font-semibold tracking-[0.02em]"
            >
              {LOCALE_LABEL[option].short}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
