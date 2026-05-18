"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { AuthBootstrap } from "@/components/auth/auth-bootstrap";
import { useCartSync } from "@/hooks/use-cart-sync";

function CartSyncProvider({ children }: { children: React.ReactNode }) {
  useCartSync();
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
      <CartSyncProvider>{children}</CartSyncProvider>
      <Toaster />
    </ThemeProvider>
  );
}
