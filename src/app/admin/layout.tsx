"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Settings,
  Menu, X, Leaf, ChevronRight, Bell, Search, LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { RoleGuard } from "@/components/auth/role-guard";
import { cn } from "@/lib/utils";

const adminLinks = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className={cn("flex items-center gap-3 p-5 border-b", collapsed && !mobile && "justify-center px-3")}>
        <div className="w-9 h-9 rounded-xl gradient-forest flex items-center justify-center shrink-0 shadow-sm">
          <Leaf className="w-5 h-5 text-white" />
        </div>
        {(!collapsed || mobile) && (
          <div>
            <p className="font-bold text-sm">BharmouriRoots</p>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Admin Panel</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {adminLinks.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setSidebarOpen(false)}
              title={collapsed && !mobile ? link.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                collapsed && !mobile && "justify-center px-2",
                active
                  ? "gradient-forest text-white shadow-md"
                  : "hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              )}
            >
              <link.icon className="w-4 h-4 shrink-0" />
              {(!collapsed || mobile) && (
                <>
                  <span className="flex-1">{link.label}</span>
                  {active && <ChevronRight className="w-3.5 h-3.5" />}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className={cn("p-3 border-t space-y-1", collapsed && !mobile && "px-2")}>
        <Link href="/" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))]", collapsed && !mobile && "justify-center px-2")} title={collapsed && !mobile ? "View Store" : undefined}>
          <Leaf className="w-4 h-4 shrink-0" />
          {(!collapsed || mobile) && <span>View Store</span>}
        </Link>
        <button
          onClick={logout}
          className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 transition-colors", collapsed && !mobile && "justify-center px-2")}
          title={collapsed && !mobile ? "Sign Out" : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {(!collapsed || mobile) && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[hsl(var(--muted))]/20 flex">
      {/* Desktop sidebar */}
      <aside className={cn("hidden lg:flex flex-col bg-[hsl(var(--card))] border-r transition-all duration-300 shrink-0", collapsed ? "w-16" : "w-64")}>
        <Sidebar />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute left-0 top-16 -right-3 w-6 h-6 rounded-full bg-[hsl(var(--card))] border shadow-sm flex items-center justify-center hover:bg-[hsl(var(--muted))] transition-colors z-10 hidden lg:flex"
          style={{ left: collapsed ? "52px" : "252px" }}
        >
          <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", collapsed && "rotate-180")} />
        </button>
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="absolute left-0 top-0 bottom-0 w-72 bg-[hsl(var(--card))] shadow-2xl"
            >
              <div className="flex justify-end p-3 border-b">
                <button onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></button>
              </div>
              <Sidebar mobile />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-40 bg-[hsl(var(--card))]/95 backdrop-blur-xl border-b h-14 flex items-center px-4 gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors">
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="relative flex-1 max-w-sm hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            <input
              placeholder="Search products, orders..."
              className="w-full pl-9 pr-4 py-1.5 rounded-lg border bg-[hsl(var(--muted))]/50 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button className="relative p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            </button>
            <div className="flex items-center gap-2 pl-2 border-l">
              <img src={user?.avatar ?? "https://i.pravatar.cc/40?img=47"} alt="Admin" className="w-8 h-8 rounded-lg object-cover border" />
              <span className="text-sm font-medium hidden sm:block">{user?.name ?? "Admin"}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <RoleGuard requireAdmin>{children}</RoleGuard>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
