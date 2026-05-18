import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | BharmouriRoots",
  description: "How BharmouriRoots collects and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl prose prose-sm dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p>We collect information you provide during signup, checkout, and support requests.</p>
      <p>Payment data is processed securely via Razorpay. We do not store full card details.</p>
      <p>We use your data to fulfill orders, improve our service, and communicate order updates.</p>
    </div>
  );
}
