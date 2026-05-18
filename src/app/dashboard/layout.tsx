"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Package, Heart, User, MapPin, LogOut,
  Menu, X, Leaf, ChevronRight,
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* User info */}
      <div className="p-5 border-b">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-[hsl(var(--primary))]/30 shrink-0">
            <img src={user?.avatar ?? "https://i.pravatar.cc/100?img=47"} alt={user?.name ?? "User"} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="font-bold truncate">{user?.name ?? "Guest User"}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {dashboardLinks.map((link) => {
          const active = pathname === link.href;
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

      {/* Bottom */}
      <div className="p-3 border-t space-y-1">
        <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))]">
          <Leaf className="w-4 h-4" /> Back to Shop
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[hsl(var(--muted))]/20">
      <div className="container mx-auto px-4 max-w-7xl py-6">
        {/* Mobile header */}
        <div className="flex items-center gap-3 mb-4 lg:hidden">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-lg border bg-[hsl(var(--card))]"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg flex-1">My Account</h1>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border bg-[hsl(var(--card))] text-red-500 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden xs:inline">Logout</span>
          </button>
        </div>

        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="bg-[hsl(var(--card))] rounded-2xl border h-fit sticky top-24 overflow-hidden">
              <Sidebar />
            </div>
          </aside>

          {/* Mobile sidebar drawer */}
          <AnimatePresence>
            {mobileSidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 lg:hidden">
                <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  className="absolute left-0 top-0 bottom-0 w-72 bg-[hsl(var(--card))] shadow-2xl"
                >
                  <div className="flex items-center justify-between p-4 border-b">
                    <span className="font-bold">My Account</span>
                    <button onClick={() => setMobileSidebarOpen(false)}><X className="w-5 h-5" /></button>
                  </div>
                  <Sidebar />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <RoleGuard>{children}</RoleGuard>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
