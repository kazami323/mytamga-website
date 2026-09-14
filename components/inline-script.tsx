"use client";

/**
 * A script that runs during HTML parsing on a full page load, and stays inert
 * when React renders it on the client.
 *
 * The [lang] root layout remounts on every language switch, which is a client
 * render. React warns there — a <script> it creates would never execute — so
 * on the client this is text/plain, and suppressHydrationWarning accepts the
 * type mismatch against the server's text/javascript on first load.
 *
 * It has to be a client component: in a server component `typeof window` is
 * always evaluated on the server, and the RSC payload would carry an
 * executable script into the client render anyway.
 *
 * Pattern from node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
