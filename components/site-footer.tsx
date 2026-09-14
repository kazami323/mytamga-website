import { getCurrentDictionary } from "@/lib/i18n/get-dictionary";

export async function SiteFooter() {
  const { t } = await getCurrentDictionary();
  const footer = t.footer;
  const links = [
    { title: t.nav.home, href: "#hero" },
    { title: t.nav.services, href: "#services" },
    { title: t.nav.calc, href: "#calc" },
    { title: t.nav.about, href: "#about" },
    { title: t.nav.contacts, href: "#contacts" },
  ];

  // Rendered on the server, so the year cannot disagree across hydration.
  const year = new Date().getFullYear();

  return (
    <footer className="w-full px-[var(--gutter)] pb-14 pt-20">
      <div className="flex flex-col gap-10 border-t border-line-soft pt-12 md:flex-row md:items-start md:justify-between">
        <p className="site-brand text-base font-semibold tracking-[-0.02em]">
          MyTamga
        </p>

        <nav aria-label={t.nav.footer}>
          <ul className="flex flex-wrap gap-x-7 gap-y-3">
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="nav-link text-sm">
                  {link.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <p className="mt-12 text-xs leading-5 text-ink-ghost">
        © {year} MyTamga. {footer.legal}
      </p>
    </footer>
  );
}
