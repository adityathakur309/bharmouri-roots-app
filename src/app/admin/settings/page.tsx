import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Settings | BharmouriRoots",
};

export default function AdminSettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        Store configuration is managed via environment variables (.env). Payment and shipping demo
        modes activate automatically when live API keys are not configured.
      </p>
      <div className="bg-[hsl(var(--card))] rounded-2xl border p-6 text-sm space-y-2">
        <p><strong>Payment:</strong> Razorpay (or mock demo mode)</p>
        <p><strong>Shipping:</strong> Shiprocket (or mock demo mode)</p>
        <p><strong>Images:</strong> Stored in MongoDB on production (Vercel); local dev may use /public/uploads</p>
      </div>
    </div>
  );
}
