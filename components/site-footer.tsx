import { CinematicFooter } from "@/components/ui/cinematic-footer";
import { getCurrentDictionary } from "@/lib/i18n/get-dictionary";

/**
 * Серверная половина подвала: собирает строки и ссылки на языке страницы и
 * отдаёт их клиентскому занавесу. Год считается здесь, чтобы сервер и браузер
 * не разошлись при гидратации.
 *
 * Кнопок App Store и Google Play нет намеренно: приложение ещё не опубликовано,
 * а ссылка в никуда хуже отсутствующей.
 */
export async function SiteFooter() {
  const { locale, t } = await getCurrentDictionary();
  const year = new Date().getFullYear();

  return (
    <CinematicFooter
      brand="MyTamga"
      heading={t.hero.title}
      marquee={t.capabilities.items.map((item) => item.title)}
      primaryLinks={[
        { label: t.hero.contact, href: `/${locale}#contacts` },
        { label: t.billing.nav, href: `/${locale}/pricing` },
      ]}
      // Оферта, политика и условия доступны с любой страницы: их проверяет
      // Click при подключении мерчанта, а на политику и условия ссылается
      // конфигурация приложения.
      legalLinks={[
        { label: t.billing.legal.offer, href: `/${locale}/offer` },
        { label: t.billing.legal.privacy, href: `/${locale}/privacy` },
        { label: t.billing.legal.terms, href: `/${locale}/terms` },
        { label: t.billing.legal.support, href: `/${locale}/support` },
      ]}
      legalNavLabel={t.nav.footer}
      copyright={`© ${year} ${t.footer.legal}`}
      backToTop={t.footer.backToTop}
    />
  );
}
