"use client";

import { useEffect, useRef, useState } from "react";

import { StoreGlyph } from "@/components/ui/store-glyph";
import { APP_LINKS, type Store } from "@/lib/app-links";

interface FloatingStoresProps {
  /** «Доступно в» — подпись для магазина, где приложение опубликовано. */
  availableIn: string;
  /** «Скоро в» — подпись для магазина, где приложения ещё нет. */
  comingSoon: string;
  label: string;
}

const STORES: { store: Store; name: string }[] = [
  { store: "googlePlay", name: "Google Play" },
  { store: "appStore", name: "App Store" },
];

/**
 * Кнопки магазинов в углу экрана на всех страницах: скачать приложение можно,
 * не спускаясь к подвалу. Когда подвал с большими кнопками открыт, плавающие
 * прячутся, чтобы не дублировать их. Магазин без адреса — не ссылка, а
 * подсказка «Скоро в …» (адреса — lib/app-links.ts).
 */
export function FloatingStores({ availableIn, comingSoon, label }: FloatingStoresProps) {
  const [footerOpen, setFooterOpen] = useState(false);
  const [hint, setHint] = useState<Store | null>(null);
  const hintTimer = useRef(0);

  useEffect(() => {
    const curtain = document.querySelector(".footer-curtain");
    if (!curtain) return;
    const observer = new IntersectionObserver(
      ([entry]) => setFooterOpen(entry.intersectionRatio >= 0.25),
      { threshold: [0, 0.25, 0.5] },
    );
    observer.observe(curtain);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => window.clearTimeout(hintTimer.current), []);

  const showHint = (store: Store) => {
    setHint(store);
    window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => setHint(null), 2200);
  };

  return (
    <nav className="floating-stores" data-hidden={footerOpen} aria-label={label}>
      {STORES.map(({ store, name }) => {
        const href = APP_LINKS[store];
        const text = `${href ? availableIn : comingSoon} ${name}`;
        return href ? (
          <a
            key={store}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="floating-store"
            aria-label={text}
            title={text}
            tabIndex={footerOpen ? -1 : 0}
          >
            <StoreGlyph store={store} className="h-5 w-5" />
          </a>
        ) : (
          <button
            key={store}
            type="button"
            className="floating-store"
            data-soon="true"
            aria-label={text}
            aria-disabled="true"
            title={text}
            tabIndex={footerOpen ? -1 : 0}
            onClick={() => showHint(store)}
          >
            <StoreGlyph store={store} className="h-5 w-5" />
            {hint === store && (
              <span className="floating-store-hint" role="status">
                {text}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
