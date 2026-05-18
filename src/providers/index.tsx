"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { AuthBootstrap } from "@/components/auth/auth-bootstrap";
import { useCartSync } from "@/hooks/use-cart-sync";
import { useWishlistSync } from "@/hooks/use-wishlist-sync";

function StoreSyncProvider({ children }: { children: React.ReactNode }) {
  useCartSync();
  useWishlistSync();
  return children;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange={false}
    >
      <AuthBootstrap />
      <StoreSyncProvider>{children}</StoreSyncProvider>
      <Toaster />
    </ThemeProvider>
  );
}
