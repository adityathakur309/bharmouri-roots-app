import { PolicyShell, buildPageMetadata } from "@/components/legal/policy-shell";
import { PrivacyBody } from "@/components/legal/privacy-body";

export const metadata = buildPageMetadata({
  title: "Privacy Policy",
  description:
    "How BharmouriRoots collects, uses, and protects your personal information when you shop with us.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <PolicyShell title="Privacy Policy">
      <PrivacyBody />
    </PolicyShell>
  );
}
