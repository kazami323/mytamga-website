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
    <html lang="ru">
      <body>
        <SitePreloader />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
