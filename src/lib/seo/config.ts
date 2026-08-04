/**
 * Single production site origin for canonicals, sitemap, OG, and robots.
 * Override with NEXT_PUBLIC_SITE_URL or SITE_URL when needed.
 */
export const SITE_NAME = "BharmouriRoots";
export const SITE_TAGLINE = "Pure Himachali Organic & Handcrafted Products";
export const SITE_DEFAULT_DESCRIPTION =
  "Shop authentic organic dals, honey, dry fruits, Himachali shawls, topi, and traditional handmade products from Bharmour, Himachal Pradesh. Free shipping on orders above ₹999.";

export const SITE_KEYWORDS = [
  "Himachali products",
  "organic dal",
  "Himalayan honey",
  "Himachali shawl",
  "Bharmour",
  "organic farming India",
  "dry fruits Himachal",
  "Kullu shawl",
  "mountain honey",
  "BharmouriRoots",
] as const;

/** Canonical production domain (no trailing slash). */
export function getSiteUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim();

  if (fromEnv) {
    try {
      const url = new URL(fromEnv);
      return url.origin;
    } catch {
      /* fall through */
    }
  }

  if (process.env.NODE_ENV === "production") {
    return "https://bharmouriroots.com";
  }

  return "http://localhost:3000";
}

export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
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
    "https://www.instagram.com/bharmouriroots",
    "https://wa.me/919805000000",
  ],
} as const;
