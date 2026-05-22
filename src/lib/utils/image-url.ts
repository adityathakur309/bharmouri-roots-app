/**
 * Product images should be stored as site-relative paths (/api/media/..., /uploads/...).
 * If a full URL was saved during local dev (localhost), strip to pathname so production works.
 */
export function normalizeProductImageUrl(url: string): string {
  if (!url || typeof url !== "string") return url;

  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const { pathname } = new URL(trimmed);
      return pathname || trimmed;
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
