export function getDashboardPathForRole(role: "user" | "admin"): string {
  return role === "admin" ? "/admin" : "/dashboard";
}

export function resolvePostLoginPath(
  role: "user" | "admin",
  callbackUrl?: string | null
): string {
  const fallback = getDashboardPathForRole(role);
  if (!callbackUrl || callbackUrl === "/" || callbackUrl.startsWith("/login")) {
    return fallback;
  }
  if (role === "user" && callbackUrl.startsWith("/admin")) {
    return "/dashboard";
  }
  return callbackUrl;
}
