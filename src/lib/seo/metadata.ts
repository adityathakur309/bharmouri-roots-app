import type { Metadata } from "next";
import {
  BRAND,
  SITE_DEFAULT_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TAGLINE,
  absoluteUrl,
  getSiteUrl,
} from "./config";

const NO_INDEX: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
};

export function buildRobots(indexable: boolean): Metadata["robots"] {
  if (!indexable) return NO_INDEX;
  return {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  };
}

export interface PageSeoInput {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  image?: string;
  imageAlt?: string;
  type?: "website" | "article";
  indexable?: boolean;
  noTitleTemplate?: boolean;
}

export function buildPageMetadata(input: PageSeoInput): Metadata {
  const {
    title,
    description,
    path,
    keywords = [...SITE_KEYWORDS],
    image = "/og/default.png",
    imageAlt = `${SITE_NAME} — ${SITE_TAGLINE}`,
    type = "website",
    indexable = true,
    noTitleTemplate = false,
  } = input;

  const canonical = absoluteUrl(path);
  const ogImage = image.startsWith("http") ? image : absoluteUrl(image);

  return {
    title: noTitleTemplate ? { absolute: title } : title,
    description,
    keywords,
    authors: [{ name: SITE_NAME, url: getSiteUrl() }],
    creator: SITE_NAME,
    publisher: BRAND.legalName,
    category: "shopping",
    alternates: { canonical },
    robots: buildRobots(indexable),
    openGraph: {
      type,
      locale: BRAND.locale,
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
      creator: "@bharmouriroots",
    },
  };
}

export function buildRootMetadata(): Metadata {
  const site = getSiteUrl();
  return {
    metadataBase: new URL(site),
    title: {
      default: `${SITE_NAME} — ${SITE_TAGLINE}`,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DEFAULT_DESCRIPTION,
    keywords: [...SITE_KEYWORDS],
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME, url: site }],
    creator: SITE_NAME,
    publisher: BRAND.legalName,
    category: "shopping",
    referrer: "origin-when-cross-origin",
    formatDetection: { telephone: true, email: true, address: true },
    alternates: { canonical: site },
    robots: buildRobots(true),
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
      shortcut: ["/favicon.ico"],
    },
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      title: SITE_NAME,
      statusBarStyle: "default",
    },
    openGraph: {
      type: "website",
      locale: BRAND.locale,
      url: site,
      siteName: SITE_NAME,
      title: `${SITE_NAME} — ${SITE_TAGLINE}`,
      description: SITE_DEFAULT_DESCRIPTION,
      images: [
        {
          url: absoluteUrl("/og/default.png"),
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — Himalayan organic & handcrafted goods`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${SITE_NAME} — ${SITE_TAGLINE}`,
      description: SITE_DEFAULT_DESCRIPTION,
      images: [absoluteUrl("/og/default.png")],
      creator: "@bharmouriroots",
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
      other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
        ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
        : undefined,
    },
    other: {
      "theme-color": "#2d6a4f",
    },
  };
}

export { NO_INDEX };
