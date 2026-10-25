import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/json-ld";
import { About } from "@/components/about";
import { Calculation } from "@/components/calculation";
import { Capabilities } from "@/components/capabilities";
import { Contact } from "@/components/contact";
import { HeroHorizon } from "@/components/hero-horizon";
import { HowItWorks } from "@/components/how-it-works";
import { SiteFooter } from "@/components/site-footer";
import { APP_LINKS } from "@/lib/app-links";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { mobileApplicationJsonLd } from "@/lib/seo";
import { pageMetadata } from "@/lib/seo-copy";

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? pageMetadata(lang, "") : {};
}

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const t = getDictionary(lang);

  return (
    <>
      <JsonLd data={mobileApplicationJsonLd({ googlePlay: APP_LINKS.googlePlay, highPrice: null })} />
      <main>
        <HeroHorizon strings={t.hero} />
        <HowItWorks />
        <Capabilities strings={t.capabilities} />
        <Calculation />
        <About />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
