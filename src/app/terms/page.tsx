import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Terms of Service",
  description: "Terms of service for shopping on BharmouriRoots.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl prose prose-sm dark:prose-invert">
      <h1>Terms of Service</h1>
      <p>
        By using BharmouriRoots, you agree to our policies on orders, payments, returns, and
        acceptable use.
      </p>
      <p>
        Products are subject to availability. Prices may change without notice. Delivery timelines
        are estimates.
      </p>
      <p>For questions, contact us via the Contact page.</p>
    </div>
  );
}
