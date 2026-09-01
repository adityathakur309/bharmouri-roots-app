/** Local catalog images — generated via `npm run generate:seed-images`. */

export function productImage(seed: string): string {
  return `/images/products/${seed}.svg`;
}

export function categoryImage(slug: string): string {
  return `/images/categories/${slug}.svg`;
}

export function heroImage(seed: string): string {
  return `/images/hero/${seed}.svg`;
}

export const DEFAULT_PRODUCT_IMAGE = productImage("default");
export const DEFAULT_HERO_IMAGE = heroImage("mountains");
