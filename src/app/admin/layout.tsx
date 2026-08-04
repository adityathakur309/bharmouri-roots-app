import { AdminShell } from "@/components/admin/admin-shell";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Admin",
  description: "BharmouriRoots admin panel.",
  path: "/admin",
  indexable: false,
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
