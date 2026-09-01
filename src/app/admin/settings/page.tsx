import type { Metadata } from "next";
import { AdminSettingsForm } from "@/components/admin/admin-settings-form";

export const metadata: Metadata = {
  title: "Admin Settings | BharmouriRoots",
};

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Business Settings</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          These values power Contact, Footer, and policy pages. Payment/shipping API keys stay in
          environment variables.
        </p>
      </div>
      <AdminSettingsForm />
    </div>
  );
}
