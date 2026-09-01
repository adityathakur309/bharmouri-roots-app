import { PolicyShell, buildPageMetadata } from "@/components/legal/policy-shell";
import { TermsBody } from "@/components/legal/terms-body";

export const metadata = buildPageMetadata({
  title: "Terms & Conditions",
  description:
    "Terms of use for shopping on BharmouriRoots — orders, payments, shipping, and customer responsibilities.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <PolicyShell title="Terms & Conditions">
      <TermsBody />
    </PolicyShell>
  );
}
