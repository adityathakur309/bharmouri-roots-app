import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db/connect";
import { productService } from "@/modules/product/product.service";
import { ProductDetailClient } from "@/components/product/product-detail-client";
import { JsonLd } from "@/components/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo/json-ld";
import { absoluteUrl, SITE_NAME } from "@/lib/seo/config";
import type { Product } from "@/types/product";

type Props = { params: Promise<{ id: string }> };

async function loadProduct(idOrSlug: string): Promise<Product | null> {
  try {
    await connectDB();
    return (await productService.getByIdOrSlug(idOrSlug)) as Product;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await loadProduct(id);
  if (!product) {
    return buildPageMetadata({
      title: "Product not found",
      description: "This product is unavailable.",
      path: `/products/${id}`,
      indexable: false,
    });
  }

  const title = `${product.name} | Buy Online`;
  const rawDescription =
    product.shortDescription ||
    product.description ||
    `Buy ${product.name} from ${SITE_NAME}`;
  const description = String(rawDescription).slice(0, 160);
  const image = product.images?.[0];
  const keywords = [
    product.name,
    product.category,
    product.categorySlug,
    product.origin,
    SITE_NAME,
    "Himachali",
    "organic",
  ].filter(Boolean);

  return buildPageMetadata({
    title,
    description,
    path: `/products/${product.slug}`,
    keywords,
    image: image
      ? image.startsWith("http")
        ? image
        : absoluteUrl(image)
      : undefined,
    imageAlt: product.name,
  });
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await loadProduct(id);
  if (!product) notFound();

  const schemas = [
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Products", path: "/products" },
      {
        name: product.category,
        path: `/products?category=${product.categorySlug}`,
      },
      { name: product.name, path: `/products/${product.slug}` },
    ]),
    productJsonLd({
      name: product.name,
      slug: product.slug,
      description: product.shortDescription || product.description,
      images: product.images ?? [],
      price: product.price,
      originalPrice: product.originalPrice,
      sku: product.slug,
      category: product.category,
      stock: product.stock ?? 0,
      rating: product.rating ?? 0,
      reviewCount: product.reviews ?? 0,
    }),
  ];

  return (
    <>
      <JsonLd data={schemas} />
      <ProductDetailClient slug={product.slug} />
    </>
  );
}
