import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";
import { SiteChrome } from "@/components/layout/site-chrome";
import { GlobalJsonLd } from "@/components/seo/global-json-ld";
import { buildRootMetadata } from "@/lib/seo/metadata";
import { getSiteUrl } from "@/lib/seo/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = buildRootMetadata();

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2d6a4f" },
    { media: "(prefers-color-scheme: dark)", color: "#1b4332" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const site = getSiteUrl();
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <link rel="preconnect" href={site} />
        <link rel="dns-prefetch" href="//picsum.photos" />
        <link rel="dns-prefetch" href="//i.pravatar.cc" />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[hsl(var(--primary))] focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to main content
        </a>
        <GlobalJsonLd />
        <Providers>
          <SiteChrome>
            <main id="main-content" className="flex-1" tabIndex={-1}>
              {children}
            </main>
          </SiteChrome>
        </Providers>
      </body>
    </html>
  );
}
