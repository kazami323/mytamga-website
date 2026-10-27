import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "@fontsource-variable/manrope";
import "@fontsource-variable/unbounded";
import "../globals.css";

import { InlineScript } from "@/components/inline-script";
import { FloatingStores } from "@/components/floating-stores";
import { SiteHeader } from "@/components/site-header";
import { SitePreloader } from "@/components/site-preloader";
import { JsonLd } from "@/components/json-ld";
import { APP_LINKS } from "@/lib/app-links";
import { HTML_LANG, LOCALES, hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { companyFor } from "@/lib/legal/company";
import {
  organizationJsonLd,
  siteUrl,
  verificationTags,
  websiteJsonLd,
} from "@/lib/seo";
import { BRAND_SUFFIX, SEO_COPY } from "@/lib/seo-copy";

// Only the four locales exist; anything else is a 404 decided at build time,
// never a server round trip.
export const dynamicParams = false;

// Страницы пересобираются не реже раза в 10 минут. Перед сайтом на хостинге
// стоит кэш nginx, который хранит страницу столько, сколько велит s-maxage:
// у полностью статичной страницы это год, и после выкладки он отдавал старую
// версию (27.10.2026). С revalidate ответ несёт s-maxage=600.
export const revalidate = 600;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    return {};
  }

  return {
    metadataBase: new URL(siteUrl()),
    // Страницы задают короткий заголовок, бренд добавляет шаблон; у главной
    // заголовок полный (`absolute`).
    title: { template: `%s${BRAND_SUFFIX}`, default: SEO_COPY[lang][""].title },
    description: SEO_COPY[lang][""].description,
    verification: verificationTags(),
  };
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const t = getDictionary(lang);
  const company = companyFor(lang);

  return (
    // The inline script adds data-theme before React hydrates; the attribute
    // is absent from the server markup, so the mismatch is expected.
    //
    // data-scroll-behavior: Next 16 no longer drops the page's smooth scrolling
    // during route changes, so switching language would animate the scroll.
    // The attribute restores the override — instant between routes, smooth for
    // in-page anchors.
    <html
      lang={HTML_LANG[lang]}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <InlineScript
          html={`(function(){try{if(localStorage.getItem("theme")==="light")document.documentElement.setAttribute("data-theme","light")}catch(e){}})()`}
        />
      </head>
      <body>
        <JsonLd
          data={organizationJsonLd({
            legalName: company.legalName,
            address: company.address,
            phone: company.phone,
            email: company.supportEmail,
            googlePlay: APP_LINKS.googlePlay,
          })}
        />
        <JsonLd data={websiteJsonLd(lang)} />
        <SitePreloader loadingLabel={t.preloader.loading} />
        <SiteHeader
          locale={lang}
          strings={{
            nav: t.nav,
            themeLabel: t.theme.light,
            pricingLabel: t.billing.nav,
          }}
        />
        {children}
        <FloatingStores
          availableIn={t.footer.googlePlayCaption}
          comingSoon={t.footer.comingSoon}
          label={t.footer.storesLabel}
        />
      </body>
    </html>
  );
}
