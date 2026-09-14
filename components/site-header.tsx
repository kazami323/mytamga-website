"use client";

import { Menu, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { CinematicThemeSwitcher } from "@/components/ui/cinematic-theme-switcher";

const NAV_ITEMS = [
  { title: "Главная", href: "#hero" },
  { title: "Услуги", href: "#services" },
  { title: "Расчёт", href: "#calc" },
  { title: "О нас", href: "#about" },
  { title: "Контакты", href: "#contacts" },
] as const;

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Closing always hands focus back to the trigger, so keyboard users are not
  // dropped at the top of the document.
  const close = useCallback(() => {
    setIsOpen(false);
    toggleRef.current?.focus();
  }, []);

  // The bar is transparent over the hero and takes on a surface once anything
  // scrolls under it, so the links never sit on top of body copy.
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="site-header-bar" data-scrolled={isScrolled}>
        {/* Three tracks with equal 1fr flanks: the links are centred on the
            viewport itself, not on the space left over beside the wordmark.
            The gutter is the same token the hero copy uses. */}
        <div className="grid h-20 grid-cols-[1fr_auto_1fr] items-center px-[var(--gutter)] lg:h-24">
          <a
            href="#hero"
            className="site-brand justify-self-start text-[0.95rem] font-semibold tracking-[-0.02em] sm:text-base"
          >
            MyTamga
          </a>

          <nav
            className="col-start-2 hidden justify-self-center md:block"
            aria-label="Основная навигация"
          >
            <ul className="flex items-center gap-7 lg:gap-9">
              {NAV_ITEMS.map(({ title, href }) => (
                <li key={title}>
                  <a href={href} className="nav-link text-sm">
                    {title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="col-start-3 flex items-center gap-2 justify-self-end">
            <CinematicThemeSwitcher />
            <button
              ref={toggleRef}
              type="button"
              className="nav-toggle inline-flex h-10 w-10 items-center justify-center md:hidden"
              aria-expanded={isOpen}
              aria-controls="site-nav-mobile"
              aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
              onClick={() => setIsOpen((open) => !open)}
            >
              {isOpen ? (
                <X className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {isOpen && (
          <nav
            id="site-nav-mobile"
            className="nav-panel mx-[var(--gutter)] mb-2 md:hidden"
            aria-label="Основная навигация"
          >
            <ul className="flex flex-col">
              {NAV_ITEMS.map(({ title, href }) => (
                <li key={title}>
                  <a
                    href={href}
                    className="nav-panel-link"
                    onClick={() => setIsOpen(false)}
                  >
                    {title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
