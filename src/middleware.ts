import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/constants/auth";
import { canAccessAdminPanel } from "@/lib/rbac";
import { verifyAccessTokenEdge } from "@/lib/utils/auth-edge";

const protectedCustomerRoutes = ["/dashboard", "/checkout"];
const protectedAdminRoutes = ["/admin"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const user = token ? await verifyAccessTokenEdge(token) : null;
  const isLoggedIn = !!user;

  const isCustomerRoute = protectedCustomerRoutes.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );
  const isAdminRoute = protectedAdminRoutes.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );

  if (isCustomerRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated admins belong in /admin, not customer dashboard
  if (isCustomerRoute && isLoggedIn && user.role === "admin" && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/admin", req.nextUrl.origin));
  }

  if (isAdminRoute) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!canAccessAdminPanel(user.role)) {
      return NextResponse.redirect(new URL("/forbidden", req.nextUrl.origin));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/checkout", "/admin/:path*"],
};
