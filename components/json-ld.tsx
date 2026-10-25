import { serializeJsonLd } from "@/lib/seo";

/** Структурированные данные для поисковиков; `<` в JSON экранируется. */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
