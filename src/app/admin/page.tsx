"use client";

import { useEffect, useState } from "react";
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
import { products as mockProducts } from "@/lib/mock-data";
import { fallbackAdminOrders } from "@/lib/admin-fallback-data";
import { formatPrice } from "@/lib/utils";
import { orderApi, productApi, userApi } from "@/services/api";

const statusBadge: Record<string, string> = {
  delivered: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  shipped: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
};

const weeklyData = [65, 45, 78, 55, 90, 72, 88];
const maxVal = Math.max(...weeklyData);

type RecentOrderRow = {
  id: string;
  customer: string;
  total: number;
  status: string;
};

export default function AdminDashboardPage() {
  const [orderCount, setOrderCount] = useState(fallbackAdminOrders.length);
  const [productCount, setProductCount] = useState(mockProducts.length);
  const [userCount, setUserCount] = useState(3);
  const [revenue, setRevenue] = useState(fallbackAdminOrders.reduce((s, o) => s + o.total, 0));
  const [recentOrders, setRecentOrders] = useState<RecentOrderRow[]>(
    fallbackAdminOrders.slice(0, 5).map((o) => ({
      id: o.id,
      customer: o.customer,
      total: o.total,
      status: o.status,
    }))
  );
  const [topProducts, setTopProducts] = useState(
    mockProducts.slice(0, 5).map((p) => ({
      ...p,
      sold: Math.floor(Math.random() * 100) + 20,
      revenue: p.price * (Math.floor(Math.random() * 100) + 20),
    }))
  );
  const [usingDemo, setUsingDemo] = useState(true);

  useEffect(() => {
    Promise.all([
      orderApi.adminList({ limit: 100 }),
      productApi.adminList({ limit: 100 }),
      userApi.adminList({ limit: 100 }),
    ])
      .then(([ordersRes, productsRes, usersRes]) => {
        const apiOrders = (ordersRes.data ?? []) as Array<{
          orderNumber: string;
          user?: { name: string };
          total: number;
          status: string;
        }>;
        if (apiOrders.length) {
          setOrderCount(apiOrders.length);
          setRevenue(apiOrders.reduce((s, o) => s + o.total, 0));
          setRecentOrders(
            apiOrders.slice(0, 5).map((o) => ({
              id: o.orderNumber,
              customer: o.user?.name ?? "Customer",
              total: o.total,
              status: o.status,
            }))
          );
          setUsingDemo(false);
        }

        const apiProducts = productsRes.data ?? [];
        if (apiProducts.length) {
          setProductCount(apiProducts.length);
          setTopProducts(
            apiProducts.slice(0, 5).map((p) => ({
              ...p,
              sold: Math.floor(Math.random() * 100) + 20,
              revenue: p.price * (Math.floor(Math.random() * 100) + 20),
            }))
          );
          setUsingDemo(false);
        }

        const apiUsers = usersRes.data ?? [];
        if (apiUsers.length) {
          setUserCount(apiUsers.length);
          setUsingDemo(false);
        }
      })
      .catch(() => {
        /* keep demo defaults */
      });
  }, []);

  const statsCards = [
    {
      label: "Total Revenue",
      value: formatPrice(revenue),
      change: "+18.2%",
      up: true,
      icon: DollarSign,
      color: "gradient-forest",
    },
    {
      label: "Total Orders",
      value: String(orderCount),
      change: "+12.5%",
      up: true,
      icon: ShoppingCart,
      color: "gradient-saffron",
    },
    {
      label: "Products",
      value: String(productCount),
      change: "+3 this week",
      up: true,
      icon: Package,
      color: "gradient-forest",
    },
    {
      label: "Total Users",
      value: String(userCount),
      change: "+5.3%",
      up: true,
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
        {usingDemo && (
          <p className="text-xs text-amber-600 mt-1">Demo stats shown where API data is empty.</p>
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
                <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${stat.up ? "text-green-600" : "text-red-500"}`}>
                  <ArrowUpRight className="w-3.5 h-3.5" />
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
            <div className="flex items-center gap-1 text-sm text-green-600 font-medium">
              <TrendingUp className="w-4 h-4" /> +18.2% vs last week
            </div>
          </div>
          <div className="flex items-end gap-3 h-36">
            {weeklyData.map((val, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${(val / maxVal) * 100}%` }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
                className={`flex-1 rounded-t-lg ${i === weeklyData.length - 1 ? "gradient-forest" : "bg-[hsl(var(--muted))]"} relative group cursor-pointer hover:opacity-90 transition-opacity`}
              >
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[hsl(var(--foreground))] text-[hsl(var(--background))] text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
                  ₹{val * 1000}
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))] mt-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <span key={d} className="flex-1 text-center">
                {d}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-[hsl(var(--card))] rounded-2xl border p-5">
          <h2 className="font-bold mb-4">Sales by Category</h2>
          <div className="space-y-3">
            {[
              { name: "Organic Dals", pct: 32, color: "gradient-forest" },
              { name: "Dry Fruits", pct: 28, color: "gradient-saffron" },
              { name: "Handcrafts", pct: 18, color: "bg-purple-500" },
              { name: "Honey", pct: 14, color: "bg-amber-500" },
              { name: "Apples", pct: 8, color: "bg-red-500" },
            ].map((cat, i) => (
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
        </div>

        <div className="bg-[hsl(var(--card))] rounded-2xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">Top Products</h2>
            <a href="/admin/products" className="text-xs text-[hsl(var(--primary))] hover:underline font-medium">
              View all
            </a>
          </div>
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
                  <p className="text-sm font-bold">{formatPrice(product.revenue)}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{product.sold} sold</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
