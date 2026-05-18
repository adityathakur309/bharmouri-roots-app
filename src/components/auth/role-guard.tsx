"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getDashboardPathForRole } from "@/lib/auth-routes";

export function RoleGuard({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }
    if (requireAdmin && user.role !== "admin") {
      router.replace(getDashboardPathForRole("user"));
      return;
    }
    if (!requireAdmin && user.role === "admin") {
      router.replace(getDashboardPathForRole("admin"));
    }
  }, [isLoading, isAuthenticated, user, requireAdmin, router]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
        Loading...
      </div>
    );
  }

  if (requireAdmin && user.role !== "admin") return null;
  if (!requireAdmin && user.role === "admin") return null;

  return <>{children}</>;
}
