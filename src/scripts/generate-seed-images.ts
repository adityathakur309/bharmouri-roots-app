/**
 * Generate local SVG catalog images under public/images/.
 * Run: npm run generate:seed-images
 */
import fs from "fs";
import path from "path";
import { SEED_CATEGORIES } from "./seeders/data/categories.data";
import { SEED_PRODUCTS } from "./seeders/data/products.data";
import {
  buildCatalogSvg,
  buildHeroSvg,
  categoryTheme,
  heroTheme,
  productTheme,
} from "@/lib/catalog-image-themes";

const ROOT = process.cwd();
const PRODUCT_DIR = path.join(ROOT, "public", "images", "products");
const CATEGORY_DIR = path.join(ROOT, "public", "images", "categories");
const HERO_DIR = path.join(ROOT, "public", "images", "hero");

const HERO_SEEDS = ["mountains", "shawls", "honey", "story-banner"] as const;

function writeSvg(dir: string, name: string, svg: string) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${name}.svg`), svg, "utf8");
}

function seedFromUrl(url: string): string | null {
  const m = url.match(/\/images\/products\/([^/?#]+)\.svg/i);
  return m?.[1] ?? null;
}

function main() {
  const productSeeds = new Set<string>(["default"]);
  for (const p of SEED_PRODUCTS) {
    for (const img of p.images) {
      const seed = seedFromUrl(img);
      if (seed) productSeeds.add(seed);
    }
  }

  for (const seed of productSeeds) {
    const theme = productTheme(seed);
    writeSvg(
      PRODUCT_DIR,
      seed,
      buildCatalogSvg(theme, { variant: "product", subtitle: "Pure · Mountain · Organic" })
    );
  }

  const categorySlugs = new Set<string>(["default"]);
  for (const c of SEED_CATEGORIES) {
    categorySlugs.add(c.slug);
  }

  for (const slug of categorySlugs) {
    const theme = categoryTheme(slug);
    writeSvg(
      CATEGORY_DIR,
      slug,
      buildCatalogSvg(theme, { variant: "category", subtitle: "Shop Himachali essentials" })
    );
  }

  for (const seed of HERO_SEEDS) {
    writeSvg(
      HERO_DIR,
      seed,
      buildHeroSvg(heroTheme(seed), {
        subtitle: "Authentic Himachali products · BharmouriRoots",
      })
    );
  }

  console.log(
    `[generate:seed-images] Wrote ${productSeeds.size} product + ${categorySlugs.size} category + ${HERO_SEEDS.length} hero SVG(s)`
  );
}

main();
