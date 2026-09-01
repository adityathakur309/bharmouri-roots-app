"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Leaf } from "lucide-react";
import { authApi } from "@/services/api";
import { setStoredToken } from "@/services/api/client";
import { useAuthStore } from "@/stores/auth-store";
import { resolvePostLoginPath } from "@/lib/auth-routes";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await authApi.oauthSession();
        const data = res.data as { user?: { role: string }; accessToken?: string } | null;
        if (!data?.user || !data.accessToken) {
          if (!cancelled) setError("Could not complete Google sign-in. Please try again.");
          return;
        }
        setStoredToken(data.accessToken);
        setSession(data.user as never);
        const next = searchParams.get("next") || "/";
        const redirectTo = resolvePostLoginPath(
          (data.user.role as "user" | "admin") ?? "user",
          next !== "/" ? next : null
        );
        router.replace(redirectTo);
      } catch {
        if (!cancelled) setError("Google sign-in failed. Please try again from the login page.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams, setSession]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="w-14 h-14 rounded-2xl gradient-forest flex items-center justify-center">
        <Leaf className="w-7 h-7 text-white" />
      </div>
      {error ? (
        <>
          <p className="font-semibold text-red-600">{error}</p>
          <button
            type="button"
            className="text-sm text-[hsl(var(--primary))] underline"
            onClick={() => router.replace("/login")}
          >
            Back to login
          </button>
        </>
      ) : (
        <>
          <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Completing Google sign-in…</p>
        </>
      )}
    </div>
  );
}
