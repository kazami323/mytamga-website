import { notFound } from "next/navigation";

import { About } from "@/components/about";
import { Calculation } from "@/components/calculation";
import { Capabilities } from "@/components/capabilities";
import { Contact } from "@/components/contact";
import { SplineSceneBasic } from "@/components/demo";
import { HowItWorks } from "@/components/how-it-works";
import { SiteFooter } from "@/components/site-footer";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const t = getDictionary(lang);

  return (
    <>
      <main>
        <SplineSceneBasic strings={t.hero} />
        <Capabilities strings={t.capabilities} />
        <HowItWorks />
        <Calculation />
        <About />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
