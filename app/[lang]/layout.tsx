import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "@fontsource-variable/manrope";
import "@fontsource-variable/unbounded";
import "../globals.css";

import { SiteHeader } from "@/components/site-header";
import { SitePreloader } from "@/components/site-preloader";
import { HTML_LANG, LOCALES, hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

// Only the four locales exist; anything else is a 404 decided at build time,
// never a server round trip.
export const dynamicParams = false;

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

  const t = getDictionary(lang);

  return {
    // The production domain is a launch item; until then links resolve
    // against the local server.
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    ),
    title: t.meta.title,
    description: t.meta.description,
    alternates: {
      canonical: `/${lang}`,
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [HTML_LANG[l], `/${l}`])),
        "x-default": "/ru",
      },
    },
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

  return (
    // The inline script adds data-theme before React hydrates; the attribute
    // is absent from the server markup, so the mismatch is expected.
    <html lang={HTML_LANG[lang]} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem("theme")==="light")document.documentElement.setAttribute("data-theme","light")}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <SitePreloader loadingLabel={t.preloader.loading} />
        <SiteHeader locale={lang} strings={{ nav: t.nav, themeLabel: t.theme.light }} />
        {children}
      </body>
    </html>
  );
}
