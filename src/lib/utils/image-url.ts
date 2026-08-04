/**
 * Product images are usually site-relative (/uploads/..., /api/media/...).
 * Absolute localhost URLs are reduced to pathname for portability.
 * External CDN / placeholder URLs (e.g. picsum) are kept intact.
 */
export function normalizeProductImageUrl(url: string): string {
  if (!url || typeof url !== "string") return url;

  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const parsed = new URL(trimmed);
      const host = parsed.hostname.toLowerCase();
      const isLocalDevHost =
        host === "localhost" ||
        host === "127.0.0.1" ||
        host === "0.0.0.0" ||
        host.endsWith(".local");

      if (isLocalDevHost) {
        return parsed.pathname || trimmed;
      }

      return trimmed;
    } catch {
      return trimmed;
    }
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function normalizeProductImages(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  return images
    .filter((item): item is string => typeof item === "string" && item.length > 0)
    .map(normalizeProductImageUrl);
}
