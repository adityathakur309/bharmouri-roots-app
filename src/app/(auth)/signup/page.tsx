"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Leaf, ArrowLeft, Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/services/api";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await authApi.startRegistration(email.trim());
      setSent(true);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Enter a valid email";
      setError(message || "Enter a valid email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex gradient-himalaya relative overflow-hidden flex-col items-center justify-center p-12">
        <div className="absolute inset-0 pattern-dots opacity-10" />
        <div className="relative text-center text-white max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
            <Leaf className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Join the BharmouriRoots Family</h1>
          <p className="text-white/70 text-lg leading-relaxed">
            Verify your email to start — then complete your account and shop authentic Himachali products.
          </p>
        </div>
      </div>

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
              <Link href="/login" className="text-[hsl(var(--primary))] font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
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
                <Button type="submit" size="lg" className="w-full gap-2" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Verify &amp; Continue
                    </>
                  )}
                </Button>
                <p className="text-center text-xs text-[hsl(var(--muted-foreground))]">
                  We&apos;ll email you a secure link to complete registration. By continuing you agree to our{" "}
                  <Link href="/terms" className="text-[hsl(var(--primary))] hover:underline">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-[hsl(var(--primary))] hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </motion.form>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-2"
              >
                <div className="w-16 h-16 rounded-full gradient-forest flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <div className="w-12 h-12 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6 text-[hsl(var(--primary))]" />
                </div>
                <h3 className="text-xl font-bold mb-2">Check your email inbox</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">
                  We sent a registration link to
                </p>
                <p className="font-semibold text-[hsl(var(--primary))] mb-4 break-all">{email}</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
                  Open the email and tap <strong>Complete Registration</strong> to finish creating your account.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setError("");
                  }}
                  className="text-sm text-[hsl(var(--primary))] hover:underline"
                >
                  Use a different email
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 pt-5 border-t text-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors min-h-11"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
