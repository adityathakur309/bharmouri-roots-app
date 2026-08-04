import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "My Account",
  description: "Manage your BharmouriRoots orders, wishlist, and profile.",
  path: "/dashboard",
  indexable: false,
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
