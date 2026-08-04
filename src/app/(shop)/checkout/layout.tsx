import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Checkout",
  description: "Secure checkout for your BharmouriRoots order.",
  path: "/checkout",
  indexable: false,
});

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
