import { buildPageMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, faqJsonLd, webPageJsonLd } from "@/lib/seo/json-ld";
import { SITE_NAME } from "@/lib/seo/config";
import { faqs } from "@/lib/mock-data";

export const metadata = buildPageMetadata({
  title: "Contact Us",
  description:
    "Contact BharmouriRoots for orders, partnerships, and product questions. Based in Bharmour, Himachal Pradesh.",
  path: "/contact",
});

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const faqSchema = faqJsonLd(
    faqs.slice(0, 8).map((f) => ({
      question: f.question,
      answer: f.answer,
    }))
  );

  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            path: "/contact",
            name: `Contact | ${SITE_NAME}`,
            description: "Contact BharmouriRoots customer support.",
            type: "ContactPage",
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Contact", path: "/contact" },
          ]),
          faqSchema,
        ]}
      />
      {children}
    </>
  );
}
