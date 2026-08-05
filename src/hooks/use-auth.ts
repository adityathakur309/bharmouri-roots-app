"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/services/api";
import { getStoredToken, setStoredToken } from "@/services/api/client";
import { useAuthStore, type AuthUser } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { resolvePostLoginPath } from "@/lib/auth-routes";

export type { AuthUser };

export function useAuth() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrated = useAuthStore((s) => s.hydrated);
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);
  const updateProfileStore = useAuthStore((s) => s.updateProfile);

  useEffect(() => {
    const onLogout = () => {
      clearSession();
      setStoredToken(null);
    };
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, [clearSession]);

  const login = useCallback(
    async (email: string, password: string, _callbackUrl = "/") => {
      try {
        const data = await authApi.login({ email, password });
        setSession(data.user);
        return {
          success: true as const,
          user: data.user,
          redirectTo: resolvePostLoginPath(data.user.role),
        };
      } catch (err: unknown) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: string }).message)
            : "Invalid email or password";
        return { success: false as const, error: message };
      }
    },
    [setSession]
  );

  const signup = useCallback(
    async (name: string, email: string, password: string, phone?: string) => {
      try {
        const data = await authApi.register({ name, email, password, phone });
        setSession(data.user);
        return {
          success: true as const,
          user: data.user,
          redirectTo: resolvePostLoginPath(data.user.role),
        };
      } catch (err: unknown) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: string }).message)
            : "Could not create account";
        return { success: false as const, error: message };
      }
    },
    [setSession]
  );

  const completeSignup = useCallback(
    async (input: {
      name: string;
      email: string;
      password: string;
      token: string;
      phone?: string;
    }) => {
      try {
        const data = await authApi.completeRegistration(input);
        setSession(data.user);
        return {
          success: true as const,
          user: data.user,
          redirectTo: resolvePostLoginPath(data.user.role),
        };
      } catch (err: unknown) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: string }).message)
            : "Could not complete registration";
        return { success: false as const, error: message };
      }
    },
    [setSession]
  );

  const logout = useCallback(() => {
    void (async () => {
      await authApi.logout();
      clearSession();
      useCartStore.getState().clearCart();
      useWishlistStore.getState().clearWishlist();
      router.push("/");
    })();
  }, [clearSession, router]);

  const updateProfile = useCallback(
    async (data: Partial<Pick<AuthUser, "name" | "phone" | "avatar">>) => {
      const res = await authApi.updateProfile(data);
      updateProfileStore(res.data);
    },
    [updateProfileStore]
  );

  return {
    user,
    isAuthenticated: hydrated && isAuthenticated,
    isLoading: !hydrated,
    login,
    signup,
    completeSignup,
    logout,
    updateProfile,
    getDashboardPath: () =>
      user ? resolvePostLoginPath(user.role) : "/dashboard",
    isAdmin: user?.role === "admin",
  };
}
