import { footer } from "@/lib/content";

const FOOTER_LINKS = [
  { title: "Главная", href: "#hero" },
  { title: "Услуги", href: "#services" },
  { title: "Расчёт", href: "#calc" },
  { title: "О нас", href: "#about" },
  { title: "Контакты", href: "#contacts" },
] as const;

export function SiteFooter() {
  // Rendered on the server, so the year cannot disagree across hydration.
  const year = new Date().getFullYear();

  return (
    <footer className="w-full px-[var(--gutter)] pb-14 pt-20">
      <div className="flex flex-col gap-10 border-t border-white/[0.07] pt-12 md:flex-row md:items-start md:justify-between">
        <p className="site-brand text-base font-semibold tracking-[-0.02em]">
          MyTamga
        </p>

        <nav aria-label="Навигация в подвале">
          <ul className="flex flex-wrap gap-x-7 gap-y-3">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="nav-link text-sm">
                  {link.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <p className="mt-12 text-xs leading-5 text-white/30">
        © {year} MyTamga. {footer.legal}
      </p>
    </footer>
  );
}
