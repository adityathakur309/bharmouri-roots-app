import { ROLE_PERMISSIONS, type AppRole, type Permission } from "@/lib/rbac";
import { getBusinessSeedSettings } from "./business-settings.data";

export interface SeedSetting {
  key: string;
  value: unknown;
  group: string;
  description: string;
}

const ROLE_CATALOG: Array<{ name: string; slug: AppRole; description: string }> = [
  { name: "Admin", slug: "admin", description: "Full store and admin panel access" },
  { name: "Manager", slug: "manager", description: "Staff catalog/order access (RBAC stub — not in User.role enum yet)" },
  { name: "User", slug: "user", description: "Customer account access" },
];

const PERMISSION_CATALOG: Array<{ key: Permission; description: string }> = [
  { key: "admin:access", description: "Access admin panel" },
  { key: "manager:access", description: "Access manager-level tools" },
  { key: "orders:read", description: "View orders" },
  { key: "orders:write", description: "Update orders" },
  { key: "products:read", description: "View products" },
  { key: "products:write", description: "Manage products" },
  { key: "users:read", description: "View users" },
  { key: "users:write", description: "Manage users" },
  { key: "customer:dashboard", description: "Customer dashboard" },
  { key: "customer:checkout", description: "Checkout" },
];

/** Build default app settings (env-aware values resolved at call time). */
export function getSeedSettings(): SeedSetting[] {
  return [
    ...getBusinessSeedSettings(),
    {
      key: "site.currency",
      value: "INR",
      group: "general",
      description: "Default storefront currency",
    },
    {
      key: "site.timezone",
      value: "Asia/Kolkata",
      group: "general",
      description: "Default timezone",
    },
    {
      key: "site.language",
      value: "en-IN",
      group: "general",
      description: "Default language locale",
    },
    {
      key: "site.theme",
      value: "system",
      group: "appearance",
      description: "Default theme preference (system | light | dark)",
    },
    {
      key: "email.from",
      value: process.env.EMAIL_FROM || "noreply@bharmouriroots.com",
      group: "email",
      description: "Default From address for transactional email",
    },
    {
      key: "email.provider",
      value: process.env.EMAIL_PROVIDER || "none",
      group: "email",
      description: "Configured email provider hint",
    },
    {
      key: "rbac.roles",
      value: ROLE_CATALOG,
      group: "rbac",
      description: "Role catalog (auth still uses User.role enum: user|admin)",
    },
    {
      key: "rbac.permissions",
      value: PERMISSION_CATALOG,
      group: "rbac",
      description: "Permission catalog aligned with src/lib/rbac",
    },
    {
      key: "rbac.role_permissions",
      value: ROLE_PERMISSIONS,
      group: "rbac",
      description: "Role → permission matrix",
    },
  ];
}
