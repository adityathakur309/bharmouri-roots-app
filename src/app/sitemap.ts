import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db/connect";
import { Category, Product } from "@/lib/db/models";
import { CANONICAL_SITE_URL } from "@/lib/seo/config";

/**
 * Serves GET /sitemap.xml (XML — not .ts).
 * Submit this URL in Google Search Console:
 *   https://bharmouriroots.com/sitemap.xml
 *
 * Always emits the production host so env misconfiguration
 * (e.g. localhost) cannot break Search Console again.
 */
export const revalidate = 3600;

function sitemapUrl(path = "/"): string {
  if (!path || path === "/") return `${CANONICAL_SITE_URL}/`;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${CANONICAL_SITE_URL}${normalized}`;
}

function toPublicImages(sources: string[]): string[] {
  return sources
    .filter((img): img is string => typeof img === "string" && img.length > 0)
    .slice(0, 5)
    .map((img) => {
      if (!img.startsWith("http")) return sitemapUrl(img);
      try {
        const host = new URL(img).hostname.toLowerCase();
        if (host === "localhost" || host === "127.0.0.1") return "";
        return img;
      } catch {
        return "";
      }
    })
    .filter(Boolean);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: sitemapUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: sitemapUrl("/products"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: sitemapUrl("/about"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: sitemapUrl("/contact"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: sitemapUrl("/terms"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: sitemapUrl("/privacy"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  let productEntries: MetadataRoute.Sitemap = [];
  let categoryEntries: MetadataRoute.Sitemap = [];

  try {
    await connectDB();

    const [products, categories] = await Promise.all([
      Product.find({ isActive: true })
        .select("slug updatedAt images")
        .sort({ updatedAt: -1 })
        .lean(),
      Category.find({ isActive: true, parent: null })
        .select("slug updatedAt image")
        .sort({ updatedAt: -1 })
        .lean(),
    ]);

    productEntries = products.map((p) => {
      const images = toPublicImages(p.images ?? []);

      return {
        url: sitemapUrl(`/products/${p.slug}`),
        lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
        ...(images.length ? { images } : {}),
      };
    });

    categoryEntries = categories.map((c) => {
      const images = c.image ? toPublicImages([c.image]) : [];

      return {
        url: sitemapUrl(`/products?category=${encodeURIComponent(c.slug)}`),
        lastModified: c.updatedAt ? new Date(c.updatedAt) : now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
        ...(images.length ? { images } : {}),
      };
    });
  } catch {
    // Sitemap still returns static pages if DB is temporarily unavailable
  }

  return [...staticPages, ...categoryEntries, ...productEntries];
}
