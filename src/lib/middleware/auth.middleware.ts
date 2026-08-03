import { User } from "@/lib/db/models";
import { canAccessAdminPanel } from "@/lib/rbac";
import { verifyAccessToken } from "@/lib/utils/auth-helper";
import { getTokenFromCookieHeader } from "@/lib/utils/cookies";
import { ForbiddenError, UnauthorizedError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";
import type { SessionUser } from "@/types/auth";

/** Resolve JWT claims from Bearer header or auth cookie (no DB check). */
export async function getAuthUser(request: Request): Promise<SessionUser | null> {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return verifyAccessToken(authHeader.slice(7));
  }

  const cookieToken = getTokenFromCookieHeader(request.headers.get("cookie"));
  if (cookieToken) {
    return verifyAccessToken(cookieToken);
  }

  return null;
}

/**
 * Authenticate request and re-validate against the database.
 * Enforces isActive and uses the current role (not a stale JWT claim).
 */
export async function requireAuth(request: Request): Promise<SessionUser> {
  const tokenUser = await getAuthUser(request);
  if (!tokenUser) throw new UnauthorizedError("Authentication required");

  const dbUser = await User.findById(tokenUser.id)
    .select("name email role isActive avatar phone")
    .lean();

  if (!dbUser) {
    logger.warn("Auth rejected: user not found", { userId: tokenUser.id });
    throw new UnauthorizedError("Authentication required");
  }

  if (!dbUser.isActive) {
    logger.warn("Auth rejected: inactive user", { userId: tokenUser.id });
    throw new UnauthorizedError("Account is deactivated");
  }

  return {
    id: String(dbUser._id),
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    avatar: dbUser.avatar,
    phone: dbUser.phone,
  };
}

/** Authenticate and require admin role from the live database record. */
export async function requireAdmin(request: Request): Promise<SessionUser> {
  const user = await requireAuth(request);
  if (!canAccessAdminPanel(user.role)) {
    logger.warn("Admin access denied", { userId: user.id, role: user.role });
    throw new ForbiddenError("Admin access required");
  }
  return user;
}
