import type { Product } from "@/types/product";
import { products as mockProducts } from "@/lib/mock-data";

export type AdminOrderRow = {
  id: string;
  dbId: string;
  customer: string;
  email: string;
  items: number;
  total: number;
  status: string;
  date: string;
  payment: string;
};

export const fallbackAdminOrders: AdminOrderRow[] = [
  {
    id: "ORD-2024-001",
    dbId: "demo-1",
    customer: "Priya Sharma",
    email: "priya@example.com",
    items: 3,
    total: 1598,
    status: "delivered",
    date: "2024-12-15",
    payment: "UPI",
  },
  {
    id: "ORD-2024-002",
    dbId: "demo-2",
    customer: "Rahul Verma",
    email: "rahul@example.com",
    items: 1,
    total: 2499,
    status: "processing",
    date: "2024-12-14",
    payment: "Card",
  },
  {
    id: "ORD-2024-003",
    dbId: "demo-3",
    customer: "Anita Kapoor",
    email: "anita@example.com",
    items: 2,
    total: 1299,
    status: "shipped",
    date: "2024-12-13",
    payment: "COD",
  },
  {
    id: "ORD-2024-004",
    dbId: "demo-4",
    customer: "Vikram Singh",
    email: "vikram@example.com",
    items: 4,
    total: 3200,
    status: "delivered",
    date: "2024-12-12",
    payment: "Net Banking",
  },
];

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "user" | "admin";
  joined: string;
  orders: number;
  spent: number;
  status: "active" | "inactive";
};

export const fallbackAdminUsers: AdminUserRow[] = [
  {
    id: "1",
    name: "Priya Sharma",
    email: "priya@example.com",
    avatar: "https://i.pravatar.cc/40?img=1",
    role: "user",
    joined: "2024-10-01",
    orders: 5,
    spent: 8400,
    status: "active",
  },
  {
    id: "2",
    name: "Rahul Verma",
    email: "rahul@example.com",
    avatar: "https://i.pravatar.cc/40?img=7",
    role: "user",
    joined: "2024-09-15",
    orders: 3,
    spent: 5200,
    status: "active",
  },
  {
    id: "3",
    name: "Admin User",
    email: "admin@bharmouriroots.com",
    avatar: "https://i.pravatar.cc/40?img=12",
    role: "admin",
    joined: "2024-01-01",
    orders: 0,
    spent: 0,
    status: "active",
  },
];

export const fallbackProducts: Product[] = mockProducts;
