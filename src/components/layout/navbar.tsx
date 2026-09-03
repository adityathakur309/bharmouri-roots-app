"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, Heart, Search, Menu, X, User, Sun, Moon, ChevronDown,
  Leaf, Package, LogOut, Settings, LayoutDashboard,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useAuth } from "@/hooks/use-auth";
import { useCategories } from "@/hooks/use-categories";
import { CategoryIcon } from "@/components/shared/category-icon";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/products", hasDropdown: true },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const fallbackShopCategories = [
  { label: "Organic Dals", href: "/products?category=organic-dals", icon: "🌾" },
  { label: "Dry Fruits", href: "/products?category=dry-fruits", icon: "🥜" },
  { label: "Fresh Apples", href: "/products?category=apples", icon: "🍎" },
  { label: "Pure Honey", href: "/products?category=honey", icon: "🍯" },
  { label: "Himachali Shawls", href: "/products?category=shawls", icon: "🧣" },
  { label: "Himachali Topi", href: "/products?category=topi", icon: "🧢" },
  { label: "Pattu", href: "/products?category=pattu", icon: "🧵" },
  { label: "Pahadi Spices", href: "/products?category=spices", icon: "🌶️" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, logout, getDashboardPath, isAdmin } = useAuth();
  const cartCount = useCartStore((s) => s.getItemCount());
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const showShopActions = !isAdmin;
  const { categories } = useCategories();

  const shopCategories =
    categories.length > 0
      ? categories.map((c) => ({
          label: c.name,
          href: `/products?category=${c.slug}`,
          icon: c.icon || "🏔️",
        }))
      : fallbackShopCategories;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setShopOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const isHome = pathname === "/";

  return (
    <>
      {/* Announcement bar */}
      <div className="gradient-forest text-white text-xs text-center py-2 px-4 font-medium tracking-wide">
        <span className="hidden sm:inline">🌿 Free shipping on orders above ₹999 | 100% Organic &amp; Authentic Himachali Products</span>
        <span className="sm:hidden">🌿 Free shipping on ₹999+ | 100% Organic</span>
      </div>

      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-500",
          isScrolled
            ? "bg-[hsl(var(--background))]/95 backdrop-blur-xl shadow-lg border-b"
            : isHome
            ? "bg-transparent"
            : "bg-[hsl(var(--background))]/95 backdrop-blur-xl border-b"
        )}
      >
        <div className="container mx-auto px-3 sm:px-4 max-w-7xl">
          <div className="flex items-center justify-between h-14 sm:h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group shrink-0 min-w-0">
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-md group-hover:shadow-lg transition-shadow shrink-0">
                <div className="gradient-forest w-full h-full flex items-center justify-center">
                  <Leaf className="text-white w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="min-w-0">
                <span className="text-sm sm:text-lg font-bold text-gradient leading-none block">BharmouriRoots</span>
                <p className="text-[9px] sm:text-[10px] text-[hsl(var(--muted-foreground))] -mt-0.5 font-medium tracking-wider uppercase hidden sm:block">Pure Himachali</p>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <div key={link.href} className="relative">
                  {link.hasDropdown ? (
                    <button
                      className={cn(
                        "flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:text-[hsl(var(--primary))]",
                        pathname.startsWith("/products")
                          ? "text-[hsl(var(--primary))]"
                          : "text-foreground"
                      )}
                      onMouseEnter={() => setShopOpen(true)}
                      onMouseLeave={() => setShopOpen(false)}
                    >
                      {link.label}
                      <ChevronDown className={cn("w-4 h-4 transition-transform", shopOpen && "rotate-180")} />
                    </button>
                  ) : (
                    <Link
                      href={link.href}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all hover:text-[hsl(var(--primary))]",
                        pathname === link.href
                          ? "text-[hsl(var(--primary))]"
                          : "text-foreground"
                      )}
                    >
                      {link.label}
                    </Link>
                  )}

                  {/* Shop dropdown */}
                  {link.hasDropdown && (
                    <AnimatePresence>
                      {shopOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full left-0 mt-1 w-72 bg-[hsl(var(--card))] border rounded-2xl shadow-2xl p-3 grid grid-cols-2 gap-1"
                          onMouseEnter={() => setShopOpen(true)}
                          onMouseLeave={() => setShopOpen(false)}
                        >
                          {shopCategories.map((cat) => (
                            <Link
                              key={cat.href}
                              href={cat.href}
                              className="flex items-center gap-2 p-2 rounded-xl hover:bg-[hsl(var(--muted))] transition-colors text-sm"
                            >
                              <CategoryIcon icon={cat.icon} alt={cat.label} size="sm" />
                              <span className="font-medium">{cat.label}</span>
                            </Link>
                          ))}
                          <Link
                            href="/products"
                            className="col-span-2 mt-1 flex items-center justify-center gap-2 p-2 rounded-xl gradient-forest text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                          >
                            <Package className="w-4 h-4" />
                            View All Products
                          </Link>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-0.5 sm:gap-2">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Theme toggle — visible sm+ only; mobile menu has its own toggle */}
              {mounted && (
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="hidden sm:flex p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors items-center justify-center"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              )}

              {showShopActions && (
                <Link
                  href="/dashboard/wishlist"
                  className="hidden sm:flex relative p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors items-center justify-center"
                >
                  <Heart className="w-5 h-5" />
                  {mounted && wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 gradient-saffron text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              )}

              {showShopActions && (
                <Link href="/cart" className="relative p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors">
                  <ShoppingCart className="w-5 h-5" />
                  {mounted && cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 gradient-forest text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}

              {/* User menu — hidden on small phones, in mobile menu instead */}
              <div className="hidden sm:block relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
                >
                  {mounted && isAuthenticated && user ? (
                    <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-[hsl(var(--primary))]">
                      <img src={user.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`} alt={user.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-[hsl(var(--card))] border rounded-2xl shadow-2xl p-2 z-50"
                    >
                      {mounted && isAuthenticated && user ? (
                        <>
                          <div className="px-3 py-2 border-b mb-2">
                            <p className="font-semibold text-sm">{user.name}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">{user.email}</p>
                          </div>
                          <Link href={getDashboardPath()} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[hsl(var(--muted))] text-sm transition-colors">
                            <LayoutDashboard className="w-4 h-4" /> {isAdmin ? "Admin Dashboard" : "My Dashboard"}
                          </Link>
                          {!isAdmin && (
                            <Link href="/dashboard/orders" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[hsl(var(--muted))] text-sm transition-colors">
                              <Package className="w-4 h-4" /> My Orders
                            </Link>
                          )}
                          {user.role === "admin" && (
                            <Link href="/admin" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[hsl(var(--muted))] text-sm transition-colors text-[hsl(var(--primary))]">
                              <Settings className="w-4 h-4" /> Admin Panel
                            </Link>
                          )}
                          <button
                            onClick={() => { logout(); setUserMenuOpen(false); }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 text-sm transition-colors mt-1 border-t pt-2"
                          >
                            <LogOut className="w-4 h-4" /> Sign Out
                          </button>
                        </>
                      ) : (
                        <>
                          <Link href="/login" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[hsl(var(--muted))] text-sm transition-colors">
                            <User className="w-4 h-4" /> Sign In
                          </Link>
                          <Link href="/signup" className="flex items-center gap-2 px-3 py-2 rounded-xl gradient-forest text-white text-sm transition-colors mt-1">
                            Create Account
                          </Link>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile menu toggle */}
              <button
                className="lg:hidden p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Search bar */}
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden pb-3"
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search for rajma, honey, shawls..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-[hsl(var(--muted))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile menu drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t bg-[hsl(var(--background))]/98 backdrop-blur-xl overflow-hidden"
              style={{ maxHeight: "calc(100dvh - 3.5rem)", overflowY: "auto" }}
            >
              <div className="container mx-auto px-4 py-4 space-y-1 pb-8">

                {/* Authenticated user info */}
                {mounted && isAuthenticated && user && (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-[hsl(var(--muted))]/60 mb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[hsl(var(--primary))]/30 shrink-0">
                      <img src={user.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`} alt={user.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{user.name}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{user.email}</p>
                    </div>
                  </div>
                )}

                {/* Nav links */}
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                      pathname === link.href || (link.hasDropdown && pathname.startsWith("/products"))
                        ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                        : "hover:bg-[hsl(var(--muted))]"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}

                {/* Shop categories grid */}
                <div className="pt-3 border-t">
                  <p className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                    Shop by Category
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {shopCategories.map((cat) => (
                      <Link
                        key={cat.href}
                        href={cat.href}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-[hsl(var(--muted))] text-sm transition-colors"
                      >
                        <CategoryIcon icon={cat.icon} alt={cat.label} size="sm" />
                        <span className="truncate">{cat.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Account section */}
                <div className="pt-3 border-t space-y-1">
                  {showShopActions && (
                    <Link
                      href="/dashboard/wishlist"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[hsl(var(--muted))] text-sm font-medium transition-colors"
                    >
                      <Heart className="w-4 h-4 shrink-0" />
                      <span>Wishlist</span>
                      {wishlistCount > 0 && (
                        <span className="ml-auto w-5 h-5 gradient-saffron text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                          {wishlistCount}
                        </span>
                      )}
                    </Link>
                  )}

                  {mounted && isAuthenticated && user ? (
                    <>
                      <Link href={getDashboardPath()} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[hsl(var(--muted))] text-sm font-medium transition-colors">
                        <LayoutDashboard className="w-4 h-4 shrink-0" /> {isAdmin ? "Admin Dashboard" : "My Dashboard"}
                      </Link>
                      {!isAdmin && (
                        <Link href="/dashboard/orders" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[hsl(var(--muted))] text-sm font-medium transition-colors">
                          <Package className="w-4 h-4 shrink-0" /> My Orders
                        </Link>
                      )}
                      {user.role === "admin" && (
                        <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[hsl(var(--muted))] text-sm font-medium text-[hsl(var(--primary))] transition-colors">
                          <Settings className="w-4 h-4 shrink-0" /> Admin Panel
                        </Link>
                      )}
                    </>
                  ) : null}
                </div>

                {/* Theme toggle */}
                {mounted && (
                  <div className="pt-3 border-t">
                    <button
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[hsl(var(--muted))] text-sm font-medium transition-colors"
                    >
                      {theme === "dark"
                        ? <Sun className="w-4 h-4 shrink-0" />
                        : <Moon className="w-4 h-4 shrink-0" />}
                      {theme === "dark" ? "Light Mode" : "Dark Mode"}
                    </button>
                  </div>
                )}

                {/* Auth buttons / sign-out */}
                <div className="pt-3 border-t">
                  {!mounted || !isAuthenticated ? (
                    <div className="flex gap-2">
                      <Link href="/login" className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">Sign In</Button>
                      </Link>
                      <Link href="/signup" className="flex-1">
                        <Button size="sm" className="w-full">Sign Up</Button>
                      </Link>
                    </div>
                  ) : (
                    <button
                      onClick={() => { logout(); setMobileOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 text-sm font-medium transition-colors"
                    >
                      <LogOut className="w-4 h-4 shrink-0" /> Sign Out
                    </button>
                  )}
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
