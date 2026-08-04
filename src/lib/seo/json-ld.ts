import { BRAND, SITE_DEFAULT_DESCRIPTION, SITE_NAME, absoluteUrl, getSiteUrl } from "./config";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${getSiteUrl()}/#organization`,
    name: SITE_NAME,
    legalName: BRAND.legalName,
    url: getSiteUrl(),
    logo: absoluteUrl("/icons/icon-512.png"),
    image: absoluteUrl("/og/default.png"),
    email: BRAND.email,
    telephone: BRAND.phone,
    sameAs: [...BRAND.sameAs],
    address: {
      "@type": "PostalAddress",
      addressLocality: BRAND.address.locality,
      addressRegion: BRAND.address.region,
      postalCode: BRAND.address.postalCode,
      addressCountry: BRAND.address.country,
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${getSiteUrl()}/#website`,
    name: SITE_NAME,
    url: getSiteUrl(),
    description: SITE_DEFAULT_DESCRIPTION,
    publisher: { "@id": `${getSiteUrl()}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${getSiteUrl()}/products?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${getSiteUrl()}/#localbusiness`,
    name: SITE_NAME,
    image: absoluteUrl("/og/default.png"),
    url: getSiteUrl(),
    telephone: BRAND.phone,
    email: BRAND.email,
    priceRange: "₹₹",
    address: {
      "@type": "PostalAddress",
      addressLocality: BRAND.address.locality,
      addressRegion: BRAND.address.region,
      postalCode: BRAND.address.postalCode,
      addressCountry: BRAND.address.country,
    },
    areaServed: {
      "@type": "Country",
      name: "India",
    },
  };
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function webPageJsonLd(input: {
  path: string;
  name: string;
  description: string;
  type?: "WebPage" | "AboutPage" | "ContactPage" | "CollectionPage";
}) {
  return {
    "@context": "https://schema.org",
    "@type": input.type ?? "WebPage",
    "@id": `${absoluteUrl(input.path)}#webpage`,
    url: absoluteUrl(input.path),
    name: input.name,
    description: input.description,
    isPartOf: { "@id": `${getSiteUrl()}/#website` },
    about: { "@id": `${getSiteUrl()}/#organization` },
  };
}

export function faqJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

export function productJsonLd(product: {
  name: string;
  slug: string;
  description: string;
  images: string[];
  price: number;
  originalPrice?: number;
  currency?: string;
  sku?: string;
  brand?: string;
  category?: string;
  stock: number;
  rating?: number;
  reviewCount?: number;
}) {
  const url = absoluteUrl(`/products/${product.slug}`);
  const images = product.images.map((img) =>
    img.startsWith("http") ? img : absoluteUrl(img)
  );
  const availability =
    product.stock > 0
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: images,
    sku: product.sku ?? product.slug,
    mpn: product.sku ?? product.slug,
    brand: {
      "@type": "Brand",
      name: product.brand ?? SITE_NAME,
    },
    category: product.category,
    url,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: product.currency ?? BRAND.currency,
      price: product.price,
      availability,
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": `${getSiteUrl()}/#organization` },
      ...(product.originalPrice && product.originalPrice > product.price
        ? { priceValidUntil: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10) }
        : {}),
    },
  };

  if (product.reviewCount && product.reviewCount > 0 && product.rating) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

export function itemListJsonLd(
  name: string,
  items: Array<{ name: string; path: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  };
}
