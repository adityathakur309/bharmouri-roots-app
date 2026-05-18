import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/constants/auth";
import { verifyAccessTokenEdge } from "@/lib/utils/auth-edge";

const protectedUserRoutes = ["/dashboard", "/checkout"];
const protectedAdminRoutes = ["/admin"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const user = token ? await verifyAccessTokenEdge(token) : null;
  const isLoggedIn = !!user;
  const role = user?.role;

  const isUserRoute = protectedUserRoutes.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );
  const isAdminRoute = protectedAdminRoutes.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );

  if (isUserRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/checkout", "/admin/:path*"],
};
