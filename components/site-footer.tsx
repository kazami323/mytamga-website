import { getCurrentDictionary } from "@/lib/i18n/get-dictionary";

export async function SiteFooter() {
  const { locale, t } = await getCurrentDictionary();
  const footer = t.footer;
  const links = [
    { title: t.nav.home, href: `/${locale}#hero` },
    { title: t.nav.services, href: `/${locale}#services` },
    { title: t.billing.nav, href: `/${locale}/pricing` },
    { title: t.nav.calc, href: `/${locale}#calc` },
    { title: t.nav.about, href: `/${locale}#about` },
    { title: t.nav.contacts, href: `/${locale}#contacts` },
  ];

  // Оферта, политика и условия обязаны быть доступны с любой страницы: их
  // проверяет Click при подключении мерчанта, а на политику и условия
  // ссылается конфигурация приложения.
  const legalLinks = [
    { title: t.billing.legal.offer, href: `/${locale}/offer` },
    { title: t.billing.legal.privacy, href: `/${locale}/privacy` },
    { title: t.billing.legal.terms, href: `/${locale}/terms` },
    { title: t.billing.legal.support, href: `/${locale}/support` },
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

      <nav aria-label={t.billing.legal.offer} className="mt-10">
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {legalLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="nav-link text-xs">
                {link.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <p className="mt-12 text-xs leading-5 text-ink-ghost">
        © {year} MyTamga. {footer.legal}
      </p>
    </footer>
  );
}
