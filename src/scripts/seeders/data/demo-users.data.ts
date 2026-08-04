export interface SeedDemoUser {
  name: string;
  email: string;
  avatar: string;
}

/** Demo shoppers used only as review authors (no carts/orders seeded). */
export const SEED_DEMO_USERS: SeedDemoUser[] = [
  {
    name: "Priya Sharma",
    email: "priya.demo@bharmouriroots.com",
    avatar: "https://i.pravatar.cc/100?img=1",
  },
  {
    name: "Rahul Verma",
    email: "rahul.demo@bharmouriroots.com",
    avatar: "https://i.pravatar.cc/100?img=7",
  },
  {
    name: "Anita Kapoor",
    email: "anita.demo@bharmouriroots.com",
    avatar: "https://i.pravatar.cc/100?img=5",
  },
  {
    name: "Vikram Singh",
    email: "vikram.demo@bharmouriroots.com",
    avatar: "https://i.pravatar.cc/100?img=12",
  },
  {
    name: "Sunita Mehta",
    email: "sunita.demo@bharmouriroots.com",
    avatar: "https://i.pravatar.cc/100?img=9",
  },
  {
    name: "Arun Sharma",
    email: "arun.demo@bharmouriroots.com",
    avatar: "https://i.pravatar.cc/100?img=15",
  },
];
