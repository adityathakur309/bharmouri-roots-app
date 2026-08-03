"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { canAccessAdminPanel, canAccessCustomerDashboard } from "@/lib/rbac";
import { getDashboardPathForRole } from "@/lib/auth-routes";

export function RoleGuard({
  children,
  requireAdmin = false,
  requireCustomer = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
  /** When true, admins are redirected to the admin panel (customer dashboard). */
  requireCustomer?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      const login = `/login?callbackUrl=${encodeURIComponent(pathname || "/")}`;
      router.replace(login);
      return;
    }

    if (requireAdmin && !canAccessAdminPanel(user.role)) {
      router.replace("/forbidden");
      return;
    }

    const treatAsCustomerArea = requireCustomer || !requireAdmin;
    if (treatAsCustomerArea && user.role === "admin" && !requireAdmin) {
      router.replace(getDashboardPathForRole("admin"));
    }
  }, [isLoading, isAuthenticated, user, requireAdmin, requireCustomer, router, pathname]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
        Loading...
      </div>
    );
  }

  if (requireAdmin && !canAccessAdminPanel(user.role)) return null;
  if ((requireCustomer || !requireAdmin) && !requireAdmin && !canAccessCustomerDashboard(user.role)) {
    return null;
  }

  return <>{children}</>;
}
