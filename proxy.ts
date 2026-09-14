import { NextResponse, type NextRequest } from "next/server";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  hasLocale,
  type Locale,
} from "@/lib/i18n/config";

// Four locales don't need a negotiation library: rank by q and match on the
// primary subtag, so zh-TW lands on zh and uz-Cyrl on uz.
function fromAcceptLanguage(header: string | null): Locale | null {
  if (!header) {
    return null;
  }

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return {
        primary: tag.trim().toLowerCase().split("-")[0],
        weight: q ? Number(q.slice(2)) || 0 : 1,
      };
    })
    .filter((entry) => entry.primary && entry.weight > 0)
    .sort((a, b) => b.weight - a.weight);

  const match = ranked.find((entry) => hasLocale(entry.primary));
  return match ? (match.primary as Locale) : null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (hasLocale(pathname.split("/")[1] ?? "")) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale =
    (cookie && hasLocale(cookie) ? cookie : null) ??
    fromAcceptLanguage(request.headers.get("accept-language")) ??
    DEFAULT_LOCALE;

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

// A constant, since the matcher must be statically analysable. It skips Next's
// own assets and anything with a file extension — without that, the locale
// redirect would swallow CSS and JS.
export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
