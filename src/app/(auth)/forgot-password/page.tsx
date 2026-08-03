"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Leaf, ArrowLeft, Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/services/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[hsl(var(--background))]">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-forest flex items-center justify-center mx-auto mb-4">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gradient">BharmouriRoots</h1>
        </div>

        <div className="bg-[hsl(var(--card))] rounded-2xl border p-6 sm:p-8 shadow-lg">
          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center mx-auto mb-3">
                    <Mail className="w-7 h-7 text-[hsl(var(--primary))]" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">Forgot Password?</h2>
                  <p className="text-[hsl(var(--muted-foreground))] text-sm">
                    No worries! Enter your email address and we&apos;ll send you a reset link.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label className="mb-1.5 block">Email Address</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                      className="h-11"
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-red-600" role="alert">
                      {error}
                    </p>
                  )}
                  <Button type="submit" size="lg" className="w-full gap-2 min-h-11" disabled={isLoading}>
                    {isLoading ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                <div className="w-16 h-16 rounded-full gradient-forest flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold mb-2">Check your email!</h2>
                <p className="text-[hsl(var(--muted-foreground))] text-sm mb-2">
                  If an account exists for that address, we&apos;ve sent a password reset link to
                </p>
                <p className="font-semibold text-[hsl(var(--primary))] mb-6 break-all">{email}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Didn&apos;t receive it? Check your spam folder or{" "}
                  <button type="button" onClick={() => setSent(false)} className="text-[hsl(var(--primary))] hover:underline min-h-11 inline-flex items-center">
                    try again
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 pt-5 border-t text-center">
            <Link href="/login" className="inline-flex items-center justify-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors min-h-11">
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
