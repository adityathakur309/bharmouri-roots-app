import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Your Cart",
  description: "Review items in your BharmouriRoots shopping cart.",
  path: "/cart",
  indexable: false,
});

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
