"use client";

import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { useCallback, useEffect, useRef, useState } from "react";

import { CinematicThemeSwitcher } from "@/components/ui/cinematic-theme-switcher";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";

type HeaderStrings = {
  nav: Dictionary["nav"];
  themeLabel: string;
  pricingLabel: string;
};

export function SiteHeader({
  locale,
  strings,
}: {
  locale: Locale;
  strings: HeaderStrings;
}) {
  const { nav } = strings;
  // Абсолютные адреса, а не якоря: со страницы тарифов «#services» ведёт в
  // никуда. На главной браузер всё так же плавно прокручивает.
  const navItems = [
    { title: nav.home, href: `/${locale}#hero` },
    { title: nav.services, href: `/${locale}#services` },
    { title: strings.pricingLabel, href: `/${locale}/pricing` },
    { title: nav.calc, href: `/${locale}#calc` },
    { title: nav.about, href: `/${locale}#about` },
    { title: nav.contacts, href: `/${locale}#contacts` },
  ];

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
            href={`/${locale}#hero`}
            className="site-brand justify-self-start"
          >
            <BrandLogo className="h-14 sm:h-16 lg:h-[4.5rem]" />
          </a>

          <nav
            className="col-start-2 hidden justify-self-center md:block"
            aria-label={nav.primary}
          >
            <ul className="flex items-center gap-7 lg:gap-9">
              {navItems.map(({ title, href }) => (
                <li key={title}>
                  <a href={href} className="nav-link text-sm">
                    {title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="col-start-3 flex items-center gap-2 justify-self-end">
            <LanguageSwitcher
              key={locale}
              locale={locale}
              label={nav.language}
              className="hidden md:inline-flex"
            />
            <CinematicThemeSwitcher label={strings.themeLabel} />
            <button
              ref={toggleRef}
              type="button"
              className="nav-toggle inline-flex h-10 w-10 items-center justify-center md:hidden"
              aria-expanded={isOpen}
              aria-controls="site-nav-mobile"
              aria-label={isOpen ? nav.closeMenu : nav.openMenu}
              onClick={() => setIsOpen((open) => !open)}
            >
              {isOpen ? (
                <X className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
              ) : (
                <Menu
                  className="h-5 w-5"
                  strokeWidth={1.6}
                  aria-hidden="true"
                />
              )}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="mx-[var(--gutter)] mb-2 flex flex-col gap-2 md:hidden">
            <LanguageSwitcher
              key={`menu-${locale}`}
              locale={locale}
              label={nav.language}
              stretch
            />
            <nav
              id="site-nav-mobile"
              className="nav-panel"
              aria-label={nav.primary}
            >
              <ul className="flex flex-col">
                {navItems.map(({ title, href }) => (
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
          </div>
        )}
      </div>
    </header>
  );
}
