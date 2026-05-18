"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Search, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        {/* Animated mountain */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="text-8xl mb-6"
        >
          🏔️
        </motion.div>

        <div className="text-gradient text-[100px] font-black leading-none mb-4">404</div>

        <h1 className="text-2xl font-bold mb-3">Lost in the Himalayas?</h1>
        <p className="text-[hsl(var(--muted-foreground))] mb-8 leading-relaxed">
          The page you&apos;re looking for has wandered off to explore the mountains. Let&apos;s get you back on track!
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button size="lg" className="gap-2 w-full sm:w-auto">
              <Home className="w-5 h-5" /> Back to Home
            </Button>
          </Link>
          <Link href="/products">
            <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
              <ShoppingBag className="w-5 h-5" /> Browse Products
            </Button>
          </Link>
        </div>

        <div className="mt-8 p-4 bg-[hsl(var(--muted))]/50 rounded-2xl">
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">Looking for something specific?</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            <input
              placeholder="Search for products..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
