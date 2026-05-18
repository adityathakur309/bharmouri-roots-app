/** Stable placeholder images (picsum.photos) — reliable hotlinking vs Unsplash. */

export function productImage(seed: string, width = 600, height = 600): string {
  return `https://picsum.photos/seed/bh-${seed}/${width}/${height}`;
}

export function categoryImage(seed: string, width = 400, height = 300): string {
  return `https://picsum.photos/seed/bh-cat-${seed}/${width}/${height}`;
}

export function heroImage(seed: string, width = 1600, height = 900): string {
  return `https://picsum.photos/seed/bh-hero-${seed}/${width}/${height}`;
}

export const DEFAULT_PRODUCT_IMAGE = productImage("default");
