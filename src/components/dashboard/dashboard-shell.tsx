"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Package, Heart, User, MapPin, LogOut,
  Menu, X, Leaf, ChevronRight, Bell,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { RoleGuard } from "@/components/auth/role-guard";
import { cn } from "@/lib/utils";

const dashboardLinks = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Orders", href: "/dashboard/orders", icon: Package },
  { label: "Wishlist", href: "/dashboard/wishlist", icon: Heart },
  { label: "Profile", href: "/dashboard/profile", icon: User },
  { label: "Addresses", href: "/dashboard/addresses", icon: MapPin },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const renderSidebar = () => (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-5 border-b shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-[hsl(var(--primary))]/30 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={user?.avatar ?? "https://i.pravatar.cc/100?img=47"} alt={user?.name ?? "User"} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="font-bold truncate">{user?.name ?? "Guest User"}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1">
        {dashboardLinks.map((link) => {
          const active =
            link.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "gradient-forest text-white shadow-md"
                  : "hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              )}
            >
              <link.icon className="w-4 h-4 shrink-0" />
              <span>{link.label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t space-y-1 shrink-0">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))]"
        >
          <Leaf className="w-4 h-4" /> Back to Shop
        </Link>
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-[100dvh] max-h-[100dvh] overflow-hidden bg-[hsl(var(--muted))]/20 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 h-full overflow-hidden bg-[hsl(var(--card))] border-r">
        {renderSidebar()}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="absolute left-0 top-0 bottom-0 w-72 bg-[hsl(var(--card))] shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b shrink-0">
                <span className="font-bold">My Account</span>
                <button type="button" onClick={() => setMobileSidebarOpen(false)} aria-label="Close menu">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="h-[calc(100%-3.5rem)] min-h-0">
                {renderSidebar()}
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <header className="shrink-0 z-40 bg-[hsl(var(--card))]/95 backdrop-blur-xl border-b h-14 flex items-center px-4 gap-3">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors min-h-11 min-w-11 inline-flex items-center justify-center"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-sm sm:text-base truncate">My Account</h1>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" className="relative p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors" aria-label="Notifications">
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 pl-2 border-l">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user?.avatar ?? "https://i.pravatar.cc/40?img=47"}
                alt={user?.name ?? "User"}
                className="w-8 h-8 rounded-lg object-cover border"
              />
              <span className="text-sm font-medium hidden sm:block truncate max-w-[10rem]">
                {user?.name ?? "User"}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 md:p-6">
          <div className="mx-auto w-full max-w-7xl">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <RoleGuard requireCustomer>{children}</RoleGuard>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
