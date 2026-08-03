"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Package,
  ShoppingCart,
  Users,
  ArrowUpRight,
  DollarSign,
  Star,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { formatPrice } from "@/lib/utils";
import { orderApi, productApi, userApi } from "@/services/api";
import type { Product } from "@/types/product";

const statusBadge: Record<string, string> = {
  delivered: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  shipped: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
};

const weekLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const categoryColors = ["gradient-forest", "gradient-saffron", "bg-purple-500", "bg-amber-500", "bg-red-500"];

type RecentOrderRow = {
  id: string;
  customer: string;
  total: number;
  status: string;
  date: string;
};

function buildWeeklyRevenueSeries(orders: RecentOrderRow[]) {
  const totals = new Array(7).fill(0);
  orders.forEach((order) => {
    const date = new Date(order.date);
    if (Number.isNaN(date.getTime())) return;
    const mondayBasedIndex = (date.getDay() + 6) % 7;
    totals[mondayBasedIndex] += order.total;
  });
  return totals;
}

function buildCategoryBreakdown(products: Product[]) {
  const counts = new Map<string, number>();
  products.forEach((product) => {
    counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
  });
  const total = products.length || 1;
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count], index) => ({
      name,
      pct: Math.round((count / total) * 100),
      color: categoryColors[index % categoryColors.length],
    }));
}

export default function AdminDashboardPage() {
  const [orderCount, setOrderCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [recentOrders, setRecentOrders] = useState<RecentOrderRow[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<Array<{ name: string; pct: number; color: string }>>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    Promise.allSettled([
      orderApi.adminList({ limit: 100 }),
      productApi.adminList({ limit: 100 }),
      userApi.adminList({ limit: 100 }),
    ]).then(([ordersResult, productsResult, usersResult]) => {
      let successCount = 0;

      if (ordersResult.status === "fulfilled") {
        const apiOrders = (ordersResult.value.data ?? []) as Array<{
          orderNumber: string;
          user?: { name: string };
          total: number;
          status: string;
          createdAt: string;
        }>;
        setOrderCount(apiOrders.length);
        setRevenue(apiOrders.reduce((sum, order) => sum + order.total, 0));
        setRecentOrders(
          apiOrders.slice(0, 5).map((order) => ({
            id: order.orderNumber,
            customer: order.user?.name ?? "Customer",
            total: order.total,
            status: order.status,
            date: order.createdAt,
          }))
        );
        successCount += 1;
      }

      if (productsResult.status === "fulfilled") {
        const apiProducts = (productsResult.value.data ?? []) as Product[];
        setProductCount(apiProducts.length);
        setTopProducts(apiProducts.slice(0, 5));
        setCategoryBreakdown(buildCategoryBreakdown(apiProducts));
        successCount += 1;
      }

      if (usersResult.status === "fulfilled") {
        const apiUsers = usersResult.value.data ?? [];
        setUserCount(apiUsers.length);
        successCount += 1;
      }

      if (successCount === 0) {
        setLoadError("Could not load dashboard data.");
      } else {
        setLoadError(null);
      }
    });
  }, []);

  const weeklyData = useMemo(() => buildWeeklyRevenueSeries(recentOrders), [recentOrders]);
  const maxVal = useMemo(() => Math.max(...weeklyData, 1), [weeklyData]);

  const statsCards = [
    {
      label: "Total Revenue",
      value: formatPrice(revenue),
      change: orderCount ? `${orderCount} orders` : "No orders yet",
      up: orderCount > 0,
      icon: DollarSign,
      color: "gradient-forest",
    },
    {
      label: "Total Orders",
      value: String(orderCount),
      change: orderCount ? "From store checkouts" : "Waiting for first order",
      up: orderCount > 0,
      icon: ShoppingCart,
      color: "gradient-saffron",
    },
    {
      label: "Products",
      value: String(productCount),
      change: productCount ? "In catalog" : "Add products to start",
      up: productCount > 0,
      icon: Package,
      color: "gradient-forest",
    },
    {
      label: "Total Users",
      value: String(userCount),
      change: userCount ? "Registered accounts" : "No users yet",
      up: userCount > 0,
      icon: Users,
      color: "gradient-saffron",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <p className="text-[hsl(var(--muted-foreground))] text-sm">
          Welcome back! Here&apos;s what&apos;s happening with your store.
        </p>
        {loadError && (
          <p className="text-xs text-amber-600 mt-1">{loadError}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statsCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[hsl(var(--card))] rounded-2xl border p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-1">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${stat.up ? "text-green-600" : "text-[hsl(var(--muted-foreground))]"}`}>
                  {stat.up ? <ArrowUpRight className="w-3.5 h-3.5" /> : null}
                  {stat.change}
                </div>
              </div>
              <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center shadow-md`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-[hsl(var(--card))] rounded-2xl border p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold">Weekly Revenue</h2>
            {revenue > 0 && (
              <div className="flex items-center gap-1 text-sm text-green-600 font-medium">
                <TrendingUp className="w-4 h-4" /> From recent orders
              </div>
            )}
          </div>
          {revenue === 0 ? (
            <EmptyState
              compact
              title="No revenue yet"
              description="Orders have not started generating revenue yet."
              className="min-h-[14rem] flex items-center"
            />
          ) : (
            <>
              <div className="flex items-end gap-3 h-36">
                {weeklyData.map((val, i) => (
                  <motion.div
                    key={weekLabels[i]}
                    initial={{ height: 0 }}
                    animate={{ height: `${(val / maxVal) * 100}%` }}
                    transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
                    className={`flex-1 rounded-t-lg ${i === weeklyData.length - 1 ? "gradient-forest" : "bg-[hsl(var(--muted))]"} relative group cursor-pointer hover:opacity-90 transition-opacity`}
                  >
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[hsl(var(--foreground))] text-[hsl(var(--background))] text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
                      {formatPrice(val)}
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))] mt-2">
                {weekLabels.map((d) => (
                  <span key={d} className="flex-1 text-center">
                    {d}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-[hsl(var(--card))] rounded-2xl border p-5">
          <h2 className="font-bold mb-4">Sales by Category</h2>
          {productCount === 0 ? (
            <EmptyState
              compact
              title="No sales data yet"
              description="Category performance will appear once products are available."
              className="min-h-[14rem] flex items-center"
            />
          ) : (
            <div className="space-y-3">
              {categoryBreakdown.map((cat, i) => (
                <div key={cat.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{cat.name}</span>
                    <span className="font-medium">{cat.pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[hsl(var(--muted))]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.pct}%` }}
                      transition={{ delay: i * 0.15, duration: 0.6, ease: "easeOut" }}
                      className={`h-full rounded-full ${cat.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-[hsl(var(--card))] rounded-2xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">Recent Orders</h2>
            <a href="/admin/orders" className="text-xs text-[hsl(var(--primary))] hover:underline font-medium">
              View all
            </a>
          </div>
          {recentOrders.length === 0 ? (
            <EmptyState
              compact
              title="No orders yet"
              description="Orders will appear here after customers complete checkout."
              primaryAction={{ label: "View orders", href: "/admin/orders" }}
              secondaryAction={{ label: "View products", href: "/admin/products" }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-semibold text-[hsl(var(--muted-foreground))] text-xs uppercase tracking-wide">Order</th>
                    <th className="pb-2 font-semibold text-[hsl(var(--muted-foreground))] text-xs uppercase tracking-wide">Customer</th>
                    <th className="pb-2 font-semibold text-[hsl(var(--muted-foreground))] text-xs uppercase tracking-wide">Total</th>
                    <th className="pb-2 font-semibold text-[hsl(var(--muted-foreground))] text-xs uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--border))]">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[hsl(var(--muted))]/30 transition-colors">
                      <td className="py-2.5 font-mono text-xs">{order.id}</td>
                      <td className="py-2.5">{order.customer}</td>
                      <td className="py-2.5 font-medium">{formatPrice(order.total)}</td>
                      <td className="py-2.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${statusBadge[order.status] ?? statusBadge.processing}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-[hsl(var(--card))] rounded-2xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">Top Products</h2>
            <a href="/admin/products" className="text-xs text-[hsl(var(--primary))] hover:underline font-medium">
              View all
            </a>
          </div>
          {topProducts.length === 0 ? (
            <EmptyState
              compact
              title="No products yet"
              description="Add products to populate this section."
              primaryAction={{ label: "Go to products", href: "/admin/products" }}
            />
          ) : (
            <div className="space-y-3">
              {topProducts.map((product, i) => (
                <div key={product.id} className="flex items-center gap-3">
                  <span className="text-[hsl(var(--muted-foreground))] font-bold w-4 text-xs">{i + 1}</span>
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-[hsl(var(--muted))] shrink-0">
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">{product.rating}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">{formatPrice(product.price)}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Stock {product.stock}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
