import { verifyAccessToken } from "@/lib/utils/auth-helper";
import { getTokenFromCookieHeader } from "@/lib/utils/cookies";
import { UnauthorizedError } from "@/lib/utils/errors";
import type { SessionUser } from "@/types/auth";

/** Resolve authenticated user from Bearer JWT or auth cookie */
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

export async function requireAuth(request: Request): Promise<SessionUser> {
  const user = await getAuthUser(request);
  if (!user) throw new UnauthorizedError("Authentication required");
  return user;
}
