"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Mail, Shield, Ban, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { userApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/shared/empty-state";

type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: "user" | "admin";
  joined: string;
  orders: number;
  spent: number;
  status: "active" | "inactive";
};

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
  const [loadError, setLoadError] = useState(false);
  const { toast } = useToast();

  const loadUsers = useCallback(async () => {
    try {
      const res = await userApi.adminList({ limit: 100, search: search || undefined });
      setUsers(mapUsers(res.data ?? []));
      setLoadError(false);
    } catch {
      setUsers([]);
      setLoadError(true);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(loadUsers, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadUsers, search]);

  const toggleActive = async (user: AdminUserRow) => {
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

      {loadError ? (
        <EmptyState
          icon={Users}
          title="Could not load users"
          description="Check your database connection, then try again."
          primaryAction={{ label: "Retry", onClick: () => void loadUsers() }}
        />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users yet"
          description="Registered customers and admins will show up here."
          primaryAction={{ label: "Refresh", onClick: () => void loadUsers() }}
        />
      ) : (
      <div className="bg-[hsl(var(--card))] rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[hsl(var(--muted))]/30 border-b">
              <tr>
                <th className="text-left p-3 sm:p-4 font-semibold text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">User</th>
                <th className="text-left p-3 sm:p-4 font-semibold text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Role</th>
                <th className="text-left p-3 sm:p-4 font-semibold text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))] hidden md:table-cell">Joined</th>
                <th className="text-left p-3 sm:p-4 font-semibold text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))] hidden lg:table-cell">Orders</th>
                <th className="text-left p-3 sm:p-4 font-semibold text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))] hidden lg:table-cell">Total Spent</th>
                <th className="text-left p-3 sm:p-4 font-semibold text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Status</th>
                <th className="text-left p-3 sm:p-4 font-semibold text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Actions</th>
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
                  <td className="p-3 sm:p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-9 h-9 rounded-xl object-cover border shrink-0"
                      />
                      <div className="min-w-0 max-w-[140px] sm:max-w-none">
                        <p className="font-medium truncate">{user.name}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 sm:p-4">
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
                  <td className="p-3 sm:p-4 text-[hsl(var(--muted-foreground))] hidden md:table-cell">{formatDate(user.joined)}</td>
                  <td className="p-3 sm:p-4 font-medium hidden lg:table-cell">{user.orders}</td>
                  <td className="p-3 sm:p-4 font-bold text-[hsl(var(--primary))] hidden lg:table-cell">
                    ₹{user.spent.toLocaleString("en-IN")}
                  </td>
                  <td className="p-3 sm:p-4">
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
                  <td className="p-3 sm:p-4">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 px-0"
                        title="Send email"
                        onClick={() => (window.location.href = `mailto:${user.email}`)}
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </Button>
                      {user.role !== "admin" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-9 w-9 px-0 text-red-500 hover:bg-red-50"
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
        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-[hsl(var(--muted-foreground))]">
            No users match your search
          </div>
        )}
      </div>
      )}
    </div>
  );
}
