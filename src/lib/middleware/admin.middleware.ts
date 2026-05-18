import { ForbiddenError } from "@/lib/utils/errors";
import { requireAuth } from "./auth.middleware";
import type { SessionUser } from "@/types/auth";

export async function requireAdmin(request: Request): Promise<SessionUser> {
  const user = await requireAuth(request);
  if (user.role !== "admin") {
    throw new ForbiddenError("Admin access required");
  }
  return user;
}
