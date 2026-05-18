import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "BharmouriRoots — Pure Himachali Organic & Handcrafted Products",
    template: "%s | BharmouriRoots",
  },
  description:
    "Shop authentic organic dals, honey, dry fruits, Himachali shawls, topi, and traditional handmade products from Bharmour, Himachal Pradesh.",
  keywords: [
    "Himachali products",
    "organic dal",
    "Himalayan honey",
    "Himachali shawl",
    "Bharmour",
    "organic farming India",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "BharmouriRoots",
    title: "BharmouriRoots — Pure Himachali Products",
    description:
      "Authentic organic & handcrafted products from the Himalayas. Free shipping on orders above ₹999.",
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen flex flex-col antialiased">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
