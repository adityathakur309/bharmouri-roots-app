import type { Metadata } from "next";
import Link from "next/link";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/json-ld";
import { webPageJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { SITE_NAME } from "@/lib/seo/config";

export const metadata: Metadata = buildPageMetadata({
  title: "About Us",
  description:
    "Learn about BharmouriRoots — authentic organic and handcrafted products from Bharmour, Himachal Pradesh.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <JsonLd
        data={[
          webPageJsonLd({
            path: "/about",
            name: `About | ${SITE_NAME}`,
            description:
              "Authentic organic and handcrafted products from Bharmour, Himachal Pradesh.",
            type: "AboutPage",
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "About", path: "/about" },
          ]),
        ]}
      />
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl gradient-forest flex items-center justify-center mx-auto mb-4">
          <Leaf className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gradient mb-3">About BharmouriRoots</h1>
        <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
          We connect mountain farmers and artisans from Bharmour with customers who value purity,
          tradition, and sustainable sourcing.
        </p>
      </div>
      <div className="space-y-4 text-[hsl(var(--muted-foreground))] leading-relaxed">
        <p>
          BharmouriRoots curates organic dals, honey, dry fruits, apples, shawls, topi, pattu, and
          spices — each product traceable to Himachali origins.
        </p>
        <p>
          Our mission is to preserve Pahadi heritage while offering a modern, trustworthy shopping
          experience for families across India.
        </p>
      </div>
      <div className="mt-10 text-center">
        <Link href="/products">
          <Button size="lg">Shop Our Collection</Button>
        </Link>
      </div>
    </div>
  );
}
