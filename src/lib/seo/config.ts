/**
 * Single production site origin for canonicals, sitemap, OG, and robots.
 * Override with NEXT_PUBLIC_SITE_URL or SITE_URL when needed —
 * but localhost / 127.0.0.1 overrides are ignored in production (fixes GSC
 * “URL not allowed” sitemap errors).
 */
export const SITE_NAME = "BharmouriRoots";
export const SITE_TAGLINE = "Pure Himachali Organic & Handcrafted Products";
/** Canonical production origin — used for sitemap, robots, and OG in production. */
export const CANONICAL_SITE_URL = "https://bharmouriroots.com";

export const SITE_DEFAULT_DESCRIPTION =
  "BharmouriRoots — buy authentic Chamba rajma, Bharmouri daal makhni, organic dals, Gaddi topi, Gaddi cultural dress, cholla dora, Kullu shawls, dry fruits, and Himalayan honey from Bharmour, Himachal Pradesh. Free shipping on orders above ₹999.";

export const SITE_KEYWORDS = [
  "BharmouriRoots",
  "Bharmouri",
  "Bharmour",
  "Bharmouri organic store",
  "Bharmour nuts",
  "Chamba rajma",
  "kugti rajma",
  "pahadi rajma",
  "bharmouri rajma",
  "bharmouri roots",
  "rajma",
  "Himachali rajma",
  "bharmouri daal makhni",
  "Bharmouri dal makhani",
  "Himachali dal makhani",
  "pahadi dal",
  "Bharmouri topi",
  "Gaddi topi",
  "Himachali topi",
  "gaddi cultural dress",
  "Gaddi dress",
  "Gaddi traditional dress",
  "cholla dora",
  "chola dora",
  "Himachali cultural dress",
  "pahadi dress",
  "Chamba traditional dress",
  "Kullu shawl",
  "Kullu shawls",
  "Himachali shawl",
  "shawls",
  "Himachali products",
  "organic dal",
  "Himalayan honey",
  "mountain honey",
  "dry fruits Himachal",
  "organic farming India",
  "Himachal Pradesh organic products",
] as const;

function isLoopbackHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.endsWith(".localhost")
  );
}

function parseOrigin(raw: string | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (isLoopbackHost(url.hostname)) return null;
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Public site origin for SEO (sitemap, robots, canonical, OG).
 * Never returns localhost in production / on Vercel — that caused Search Console
 * “This url is not allowed for a Sitemap at this location” errors.
 */
export function getSiteUrl(): string {
  const fromEnv =
    parseOrigin(process.env.NEXT_PUBLIC_SITE_URL) ||
    parseOrigin(process.env.SITE_URL) ||
    parseOrigin(process.env.NEXTAUTH_URL);

  if (fromEnv) return fromEnv;

  const isProdRuntime =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL === "1" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.VERCEL_ENV === "preview";

  if (isProdRuntime) {
    return CANONICAL_SITE_URL;
  }

  return "http://localhost:3000";
}

export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

/** True when a URL is safe to publish in sitemap / robots for this brand. */
export function isIndexablePublicUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (isLoopbackHost(parsed.hostname)) return false;
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const siteHost = new URL(getSiteUrl()).hostname.replace(/^www\./, "");
    const urlHost = parsed.hostname.replace(/^www\./, "");
    return urlHost === siteHost || urlHost.endsWith(`.${siteHost}`);
  } catch {
    return false;
  }
}

export const BRAND = {
  name: SITE_NAME,
  legalName: "BharmouriRoots",
  email: "hello@bharmouriroots.com",
  phone: "+91-98050-00000",
  locale: "en_IN",
  currency: "INR",
  country: "IN",
  address: {
    locality: "Bharmour",
    region: "Himachal Pradesh",
    country: "IN",
    postalCode: "176315",
  },
  sameAs: [
    "https://www.instagram.com/manimaheshhikersofficial",
    "https://wa.me/918894985606",
  ],
} as const;
