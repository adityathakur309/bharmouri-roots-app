"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Leaf, ArrowRight, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { resolvePostLoginPath } from "@/lib/auth-routes";
import { useToast } from "@/hooks/use-toast";
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const getCallbackUrl = () => {
    if (typeof window === "undefined") return "/";
    return new URLSearchParams(window.location.search).get("callbackUrl") ?? "/";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast({ title: "Please fill all fields", variant: "destructive" }); return; }
    setIsLoading(true);
    const callbackUrl = getCallbackUrl();
    const result = await login(email, password, callbackUrl);
    setIsLoading(false);
    if (result.success) {
      const redirectTo = resolvePostLoginPath(
        result.user?.role ?? "user",
        callbackUrl !== "/" ? callbackUrl : null
      );
      toast({ title: "Welcome back! 🏔️", description: "Successfully logged in." });
      router.push(redirectTo);
    } else {
      toast({ title: result.error ?? "Login failed", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel */}
      <div className="hidden lg:flex gradient-himalaya relative overflow-hidden flex-col items-center justify-center p-12">
        <div className="absolute inset-0 pattern-dots opacity-10" />
        <div className="relative text-center text-white max-w-md">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
              <Leaf className="w-10 h-10 text-white" />
            </div>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-3xl font-bold mb-3">
            Welcome Back to BharmouriRoots
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-white/70 text-lg leading-relaxed">
            Sign in to access your orders, wishlist, and exclusive deals from the Himalayas.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-10 space-y-4">
            {["✅ Track your orders", "❤️ Access your wishlist", "🎁 Exclusive member offers", "🚀 Faster checkout"].map((item) => (
              <div key={item} className="flex items-center gap-3 text-white/80 text-sm">
                <span>{item}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Decorative */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-black/20 to-transparent" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-white/5" />
      </div>

      {/* Right panel - Form */}
      <div className="flex items-center justify-center p-6 md:p-12 bg-[hsl(var(--background))]">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 rounded-2xl gradient-forest flex items-center justify-center mx-auto mb-3">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gradient">BharmouriRoots</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-1">Sign In</h2>
            <p className="text-[hsl(var(--muted-foreground))] text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-[hsl(var(--primary))] font-semibold hover:underline">
                Create one free
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label className="mb-1.5 block">Email Address</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="h-11"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <Label>Password</Label>
                <Link href="/forgot-password" className="text-xs text-[hsl(var(--primary))] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-11 pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full gap-2" disabled={isLoading}>
              {isLoading ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  Signing in...
                </>
              ) : (
                <><LogIn className="w-5 h-5" /> Sign In</>
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[hsl(var(--background))] px-3 text-xs text-[hsl(var(--muted-foreground))]">OR CONTINUE WITH</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" className="gap-2" disabled title="JWT login only">
              🌐 Google
            </Button>
            <Button type="button" variant="outline" className="gap-2" disabled title="Coming soon">
              📘 Facebook
            </Button>
          </div>

          <p className="text-center text-xs text-[hsl(var(--muted-foreground))] mt-6">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="hover:underline text-[hsl(var(--primary))]">Terms</Link> and{" "}
            <Link href="/privacy" className="hover:underline text-[hsl(var(--primary))]">Privacy Policy</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
