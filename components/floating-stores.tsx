"use client";

import { useEffect, useRef, useState } from "react";

import { StoreGlyph } from "@/components/ui/store-glyph";
import { APP_LINKS, type Store } from "@/lib/app-links";

interface FloatingStoresProps {
  /** «Скачайте приложение» — заголовок карточки (на телефоне скрыт). */
  title: string;
  /** «Доступно в» — подпись для магазина, где приложение опубликовано. */
  availableIn: string;
  /** «Скоро в» — подпись для магазина, где приложения ещё нет. */
  comingSoon: string;
  /** «скоро» — метка на кнопке такого магазина. */
  soonTag: string;
  label: string;
}

const STORES: { store: Store; name: string }[] = [
  { store: "googlePlay", name: "Google Play" },
  { store: "appStore", name: "App Store" },
];

/** Значок Google Play в фирменных цветах: монохромный треугольник не узнают. */
function GooglePlayColor() {
  return (
    <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 2.6 13 12 4 21.4c-.3-.3-.4-.7-.4-1.2V3.8c0-.5.1-.9.4-1.2Z" fill="#4285F4" />
      <path d="M4 2.6c.4-.4 1-.4 1.7 0l10.9 7.1L13 12Z" fill="#34A853" />
      <path d="M4 21.4 13 12l3.6 2.3-10.9 7.1c-.7.4-1.3.4-1.7 0Z" fill="#EA4335" />
      <path d="m16.6 9.7 3.1 2c.9.6.9 1.4 0 2l-3.1 2L13 12Z" fill="#FBBC04" />
    </svg>
  );
}

/**
 * Карточка «Скачайте приложение» в углу экрана на всех страницах: скачать
 * можно, не спускаясь к подвалу. Когда подвал с большими кнопками открыт,
 * карточка прячется. Магазин без адреса — не ссылка, а кнопка с пометкой
 * «скоро» и подсказкой (адреса — lib/app-links.ts).
 */
export function FloatingStores({ title, availableIn, comingSoon, soonTag, label }: FloatingStoresProps) {
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
      <p className="floating-stores-title" aria-hidden="true">
        {title}
      </p>
      {STORES.map(({ store, name }) => {
        const href = APP_LINKS[store];
        const text = `${href ? availableIn : comingSoon} ${name}`;
        const glyph =
          store === "googlePlay" ? <GooglePlayColor /> : <StoreGlyph store={store} className="h-5 w-5 shrink-0" />;
        return href ? (
          <a
            key={store}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="floating-store floating-store--primary"
            aria-label={text}
            tabIndex={footerOpen ? -1 : 0}
          >
            {glyph}
            <span>
              <small>{availableIn}</small>
              {name}
            </span>
          </a>
        ) : (
          <button
            key={store}
            type="button"
            className="floating-store floating-store--soon"
            aria-label={text}
            aria-disabled="true"
            tabIndex={footerOpen ? -1 : 0}
            onClick={() => showHint(store)}
          >
            {glyph}
            <span>{name}</span>
            <span className="floating-store-tag" aria-hidden="true">
              {soonTag}
            </span>
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
