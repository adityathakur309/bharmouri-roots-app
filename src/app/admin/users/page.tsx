"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Mail, Shield, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { userApi } from "@/services/api";
import { withFallbackArray } from "@/lib/api-fallback";
import { fallbackAdminUsers, type AdminUserRow } from "@/lib/admin-fallback-data";
import { useToast } from "@/hooks/use-toast";

function mapUsers(
  data: Array<{
    id: string;
    name: string;
    email: string;
    role: "user" | "admin";
    avatar?: string;
    isActive?: boolean;
    createdAt?: string;
  }>
): AdminUserRow[] {
  return data.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    avatar: u.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}`,
    role: u.role,
    joined: u.createdAt ?? new Date().toISOString(),
    orders: 0,
    spent: 0,
    status: u.isActive === false ? "inactive" : "active",
  }));
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [usingDemo, setUsingDemo] = useState(false);
  const { toast } = useToast();

  const loadUsers = useCallback(async () => {
    try {
      const res = await userApi.adminList({ limit: 100, search: search || undefined });
      const rows = mapUsers(res.data ?? []);
      const list = withFallbackArray(rows.length ? rows : null, fallbackAdminUsers);
      setUsers(list);
      setUsingDemo(!rows.length);
    } catch {
      setUsers(fallbackAdminUsers);
      setUsingDemo(true);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(loadUsers, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadUsers, search]);

  const toggleActive = async (user: AdminUserRow) => {
    if (usingDemo && !user.id.match(/^[a-f0-9]{24}$/i)) {
      toast({ title: "Demo user — connect API to manage users" });
      return;
    }
    const next = user.status === "active" ? false : true;
    try {
      await userApi.update(user.id, { isActive: next });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: next ? "active" : "inactive" } : u))
      );
      toast({ title: next ? "User activated" : "User deactivated" });
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {usingDemo && (
        <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2">
          Showing demo users — register accounts or run seed to see real data.
        </p>
      )}

      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">{users.length} registered users</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full pl-9 pr-4 py-2 rounded-xl border bg-[hsl(var(--card))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
        />
      </div>

      <div className="bg-[hsl(var(--card))] rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[hsl(var(--muted))]/30 border-b">
              <tr>
                {["User", "Role", "Joined", "Orders", "Total Spent", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="text-left p-4 font-semibold text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {filtered.map((user, i) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.08 }}
                  className="hover:bg-[hsl(var(--muted))]/20 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-9 h-9 rounded-xl object-cover border"
                      />
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {user.role === "admin" ? (
                      <Badge variant="saffron" className="gap-1 text-[10px]">
                        <Shield className="w-3 h-3" /> Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">
                        Customer
                      </Badge>
                    )}
                  </td>
                  <td className="p-4 text-[hsl(var(--muted-foreground))]">{formatDate(user.joined)}</td>
                  <td className="p-4 font-medium">{user.orders}</td>
                  <td className="p-4 font-bold text-[hsl(var(--primary))]">
                    ₹{user.spent.toLocaleString("en-IN")}
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        user.status === "active"
                          ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                      }`}
                    >
                      {user.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 px-0"
                        title="Send email"
                        onClick={() => (window.location.href = `mailto:${user.email}`)}
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </Button>
                      {user.role !== "admin" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 px-0 text-red-500 hover:bg-red-50"
                          title={user.status === "active" ? "Deactivate" : "Activate"}
                          onClick={() => toggleActive(user)}
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
