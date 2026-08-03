/**
 * Centralized RBAC helpers.
 *
 * Active JWT/DB roles today: "user" | "admin"
 * "manager" is reserved for future use (stub permissions only).
 */

export type AppRole = "admin" | "manager" | "user";
export type ActiveRole = "admin" | "user";

export type Permission =
  | "admin:access"
  | "manager:access"
  | "orders:read"
  | "orders:write"
  | "products:read"
  | "products:write"
  | "users:read"
  | "users:write"
  | "customer:dashboard"
  | "customer:checkout";

/** Planned permission matrix (manager not issued by auth yet). */
export const ROLE_PERMISSIONS: Record<AppRole, readonly Permission[]> = {
  admin: [
    "admin:access",
    "manager:access",
    "orders:read",
    "orders:write",
    "products:read",
    "products:write",
    "users:read",
    "users:write",
  ],
  manager: [
    "manager:access",
    "orders:read",
    "orders:write",
    "products:read",
    "products:write",
  ],
  user: ["customer:dashboard", "customer:checkout"],
} as const;

export function isActiveRole(role: string | undefined | null): role is ActiveRole {
  return role === "admin" || role === "user";
}

/** Map active DB/JWT role onto AppRole (manager not persisted yet). */
export function toAppRole(role: ActiveRole | string | undefined | null): AppRole {
  if (role === "admin") return "admin";
  if (role === "manager") return "manager"; // forward-compatible
  return "user";
}

export function permissionsFor(role: AppRole | ActiveRole | string | undefined | null): readonly Permission[] {
  return ROLE_PERMISSIONS[toAppRole(role)];
}

export function hasPermission(
  role: AppRole | ActiveRole | string | undefined | null,
  permission: Permission
): boolean {
  return permissionsFor(role).includes(permission);
}

export function hasAnyPermission(
  role: AppRole | ActiveRole | string | undefined | null,
  needed: Permission[]
): boolean {
  const granted = permissionsFor(role);
  return needed.some((p) => granted.includes(p));
}

export function canAccessAdminPanel(role: string | undefined | null): boolean {
  return hasPermission(role, "admin:access");
}

/** Future: managers + admins. Today only admins have admin:access. */
export function canAccessManagerPanel(role: string | undefined | null): boolean {
  return hasAnyPermission(role, ["admin:access", "manager:access"]);
}

export function canAccessCustomerDashboard(role: string | undefined | null): boolean {
  // Admins are redirected away from customer dashboard by RoleGuard
  return role === "user";
}

export function isStaffRole(role: string | undefined | null): boolean {
  return role === "admin" || role === "manager";
}
