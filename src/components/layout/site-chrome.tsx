"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { FloatingSocialButtons } from "@/components/layout/floating-social";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Admin + account dashboards use their own sticky shell (sidebar/header).
  const hideShopChrome =
    pathname.startsWith("/admin") || pathname.startsWith("/dashboard");

  return (
    <>
      {!hideShopChrome && <Navbar />}
      {children}
      {!hideShopChrome && <Footer />}
      {!hideShopChrome && <FloatingSocialButtons />}
    </>
  );
}
