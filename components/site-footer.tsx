import { CinematicFooter } from "@/components/ui/cinematic-footer";
import { APP_LINKS } from "@/lib/app-links";
import { getCurrentDictionary } from "@/lib/i18n/get-dictionary";

/**
 * Серверная половина подвала: собирает строки и ссылки на языке страницы и
 * отдаёт их клиентскому занавесу. Год считается здесь, чтобы сервер и браузер
 * не разошлись при гидратации.
 *
 * Кнопки магазинов есть всегда, но ссылками становятся только когда в
 * lib/app-links.ts появится адрес. До публикации приложения они говорят
 * «Скоро в App Store» и никуда не ведут.
 */
export async function SiteFooter() {
  const { locale, t } = await getCurrentDictionary();
  const year = new Date().getFullYear();

  return (
    <CinematicFooter
      brand="MyTamga"
      heading={t.hero.title}
      marquee={t.capabilities.items.map((item) => item.title)}
      stores={[
        {
          store: "appStore",
          name: "App Store",
          caption: APP_LINKS.appStore ? t.footer.appStoreCaption : t.footer.comingSoon,
          href: APP_LINKS.appStore,
        },
        {
          store: "googlePlay",
          name: "Google Play",
          caption: APP_LINKS.googlePlay ? t.footer.googlePlayCaption : t.footer.comingSoon,
          href: APP_LINKS.googlePlay,
        },
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
