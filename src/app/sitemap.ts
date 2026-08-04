import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db/connect";
import { Category, Product } from "@/lib/db/models";
import { absoluteUrl } from "@/lib/seo/config";

/**
 * Serves GET /sitemap.xml (XML — not .ts).
 * Submit this URL in Google Search Console:
 *   https://bharmouriroots.com/sitemap.xml
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/products"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/about"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: absoluteUrl("/contact"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: absoluteUrl("/terms"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: absoluteUrl("/privacy"),
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
      Product.find({ isActive: true }).select("slug updatedAt images").lean(),
      Category.find({ isActive: true, parent: null })
        .select("slug updatedAt image")
        .lean(),
    ]);

    productEntries = products.map((p) => {
      const images = (p.images ?? [])
        .filter((img): img is string => typeof img === "string" && img.length > 0)
        .slice(0, 5)
        .map((img) => (img.startsWith("http") ? img : absoluteUrl(img)));

      return {
        url: absoluteUrl(`/products/${p.slug}`),
        lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
        ...(images.length ? { images } : {}),
      };
    });

    categoryEntries = categories.map((c) => ({
      url: absoluteUrl(`/products?category=${c.slug}`),
      lastModified: c.updatedAt ? new Date(c.updatedAt) : now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      ...(c.image
        ? {
            images: [
              c.image.startsWith("http") ? c.image : absoluteUrl(c.image),
            ],
          }
        : {}),
    }));
  } catch {
    // Sitemap still returns static pages if DB is temporarily unavailable
  }

  return [...staticPages, ...categoryEntries, ...productEntries];
}
