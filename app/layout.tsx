import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "@fontsource-variable/unbounded";
import "./globals.css";

import { SiteHeader } from "@/components/site-header";
import { SitePreloader } from "@/components/site-preloader";

export const metadata: Metadata = {
  title: "Место под текст",
  description: "Место под текст",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The inline script adds data-theme before React hydrates; the attribute
    // is absent from the server markup, so the mismatch is expected.
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem("theme")==="light")document.documentElement.setAttribute("data-theme","light")}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <SitePreloader />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
