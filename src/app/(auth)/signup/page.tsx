"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Leaf, Check, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const passwordRequirements = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Contains uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Contains a number", test: (p: string) => /[0-9]/.test(p) },
];

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
    setIsLoading(true);
    const result = await signup(name, email, password);
    setIsLoading(false);
    if (result.success) {
      toast({ title: "Account created! 🎉", description: "Welcome to BharmouriRoots!" });
      router.push(result.redirectTo ?? "/dashboard");
    } else {
      toast({ title: result.error ?? "Signup failed", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel */}
      <div className="hidden lg:flex gradient-himalaya relative overflow-hidden flex-col items-center justify-center p-12">
        <div className="absolute inset-0 pattern-dots opacity-10" />
        <div className="relative text-center text-white max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
            <Leaf className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Join the BharmouriRoots Family</h1>
          <p className="text-white/70 text-lg leading-relaxed">
            Be part of a community that loves authentic, organic products from the heart of Himachal Pradesh.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { emoji: "🌿", title: "100% Organic", desc: "Certified pure products" },
              { emoji: "🏔️", title: "Mountain Fresh", desc: "Sourced from 2000m+" },
              { emoji: "🎁", title: "Welcome Offer", desc: "10% off first order" },
              { emoji: "🚚", title: "Free Shipping", desc: "On orders ₹999+" },
            ].map((item) => (
              <div key={item.title} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-left">
                <span className="text-2xl">{item.emoji}</span>
                <p className="font-semibold text-sm mt-1">{item.title}</p>
                <p className="text-white/60 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-white/5" />
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center p-6 md:p-12 bg-[hsl(var(--background))]">
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 rounded-2xl gradient-forest flex items-center justify-center mx-auto mb-3">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gradient">BharmouriRoots</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-1">Create Account</h2>
            <p className="text-[hsl(var(--muted-foreground))] text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-[hsl(var(--primary))] font-semibold hover:underline">Sign in</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required className="h-11" />
            </div>
            <div>
              <Label className="mb-1.5 block">Email Address</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="h-11" />
            </div>
            <div>
              <Label className="mb-1.5 block">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  required
                  className="h-11 pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && (
                <div className="mt-2 space-y-1">
                  {passwordRequirements.map((req) => (
                    <div key={req.label} className={`flex items-center gap-1.5 text-xs ${req.test(password) ? "text-green-600" : "text-[hsl(var(--muted-foreground))]"}`}>
                      <Check className={`w-3 h-3 ${req.test(password) ? "opacity-100" : "opacity-30"}`} />
                      {req.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label className="mb-1.5 block">Confirm Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
                className={`h-11 ${confirmPassword && password !== confirmPassword ? "border-red-400 focus-visible:ring-red-400" : ""}`}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords don&apos;t match</p>
              )}
            </div>

            <Button type="submit" size="lg" className="w-full gap-2" disabled={isLoading || (!!confirmPassword && password !== confirmPassword)}>
              {isLoading ? (
                <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />Creating account...</>
              ) : (
                <><UserPlus className="w-5 h-5" /> Create Account</>
              )}
            </Button>

            <p className="text-center text-xs text-[hsl(var(--muted-foreground))]">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="text-[hsl(var(--primary))] hover:underline">Terms</Link> and{" "}
              <Link href="/privacy" className="text-[hsl(var(--primary))] hover:underline">Privacy Policy</Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
