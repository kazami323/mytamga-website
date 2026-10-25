import type { MetadataRoute } from "next";

import { siteUrl } from "../lib/seo.ts";

export default function robots(): MetadataRoute.Robots {
  const site = siteUrl();

  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/*/pay/"] },
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
