import { buildPageMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/json-ld";
import { webPageJsonLd } from "@/lib/seo/json-ld";
import { SITE_DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/seo/config";

export const metadata = buildPageMetadata({
  title: "Shop Himachali Organic & Handcrafted Products",
  description: SITE_DEFAULT_DESCRIPTION,
  path: "/products",
  keywords: [
    "shop Himachali products",
    "BharmouriRoots",
    "Chamba rajma",
    "Bharmouri topi",
    "Gaddi topi",
    "Kullu shawls",
    "Bharmour nuts",
    "organic dals online",
    "Himalayan honey",
    "Himachali shawls",
    SITE_NAME,
  ],
});

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          path: "/products",
          name: `Shop | ${SITE_NAME}`,
          description: SITE_DEFAULT_DESCRIPTION,
          type: "CollectionPage",
        })}
      />
      {children}
    </>
  );
}
