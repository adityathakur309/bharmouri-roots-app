import { AUTH_COOKIE } from "@/lib/constants/auth";

export function getTokenFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${AUTH_COOKIE}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(AUTH_COOKIE.length + 1));
}
