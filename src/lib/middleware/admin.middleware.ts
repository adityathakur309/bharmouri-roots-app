import { canAccessAdminPanel } from "@/lib/rbac";
import { ForbiddenError } from "@/lib/utils/errors";
import { requireAdmin as requireAdminFromAuth } from "./auth.middleware";
import type { SessionUser } from "@/types/auth";

/** @deprecated Prefer importing requireAdmin from auth.middleware — kept for existing imports. */
export async function requireAdmin(request: Request): Promise<SessionUser> {
  return requireAdminFromAuth(request);
}

/** Utility guard when a session user is already resolved. */
export function assertAdmin(user: SessionUser): void {
  if (!canAccessAdminPanel(user.role)) {
    throw new ForbiddenError("Admin access required");
  }
}
