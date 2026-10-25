import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LegalDocumentView } from "@/components/legal/legal-document";
import { SiteFooter } from "@/components/site-footer";
import { hasLocale } from "@/lib/i18n/config";
import { pageMetadata } from "@/lib/seo-copy";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/offer">): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? pageMetadata(lang, "/offer") : {};
}

export default async function OfferPage({ params }: PageProps<"/[lang]/offer">) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  return (
    <>
      <main>
        <LegalDocumentView slug="offer" locale={lang} strings={getDictionary(lang).billing} />
      </main>
      <SiteFooter />
    </>
  );
}
