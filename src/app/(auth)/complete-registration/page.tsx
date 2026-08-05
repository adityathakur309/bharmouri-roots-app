"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Eye, EyeOff, Leaf, UserPlus } from "lucide-react";
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

function CompleteRegistrationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { completeSignup } = useAuth();

  const emailFromUrl = useMemo(
    () => (searchParams.get("email") ?? "").trim().toLowerCase(),
    [searchParams]
  );
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!emailFromUrl || !token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          This registration link is missing required details. Please start again from Sign up.
        </p>
        <Link href="/signup">
          <Button className="w-full min-h-11">Go to Sign up</Button>
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    const result = await completeSignup({
      name: name.trim(),
      email: emailFromUrl,
      password,
      token,
    });
    setIsLoading(false);

    if (result.success) {
      toast({
        title: "Account created!",
        description: "Welcome to BharmouriRoots.",
      });
      router.push(result.redirectTo ?? "/dashboard");
    } else {
      setError(result.error ?? "Could not complete registration");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-2">
        <div className="w-14 h-14 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center mx-auto mb-3">
          <UserPlus className="w-7 h-7 text-[hsl(var(--primary))]" />
        </div>
        <h2 className="text-xl font-bold mb-2">Complete registration</h2>
        <p className="text-[hsl(var(--muted-foreground))] text-sm">
          Finish setting up your BharmouriRoots account.
        </p>
      </div>

      <div>
        <Label className="mb-1.5 block">Full Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          required
          minLength={2}
          autoComplete="name"
          className="h-11"
        />
      </div>

      <div>
        <Label className="mb-1.5 block">Email Address</Label>
        <Input
          type="email"
          value={emailFromUrl}
          readOnly
          required
          className="h-11 bg-[hsl(var(--muted))]/40"
        />
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
            minLength={8}
            autoComplete="new-password"
            className="h-11 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {password && (
          <div className="mt-2 space-y-1">
            {passwordRequirements.map((req) => (
              <div
                key={req.label}
                className={`flex items-center gap-1.5 text-xs ${
                  req.test(password)
                    ? "text-green-600"
                    : "text-[hsl(var(--muted-foreground))]"
                }`}
              >
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
          minLength={8}
          autoComplete="new-password"
          className={`h-11 ${
            confirmPassword && password !== confirmPassword
              ? "border-red-400 focus-visible:ring-red-400"
              : ""
          }`}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full gap-2"
        disabled={isLoading || (!!confirmPassword && password !== confirmPassword)}
      >
        {isLoading ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
            />
            Creating account...
          </>
        ) : (
          <>
            <UserPlus className="w-5 h-5" />
            Register
          </>
        )}
      </Button>
    </form>
  );
}

export default function CompleteRegistrationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[hsl(var(--background))]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-forest flex items-center justify-center mx-auto mb-4">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gradient">BharmouriRoots</h1>
        </div>
        <div className="bg-[hsl(var(--card))] rounded-2xl border p-6 sm:p-8 shadow-lg">
          <Suspense
            fallback={
              <p className="text-sm text-center text-[hsl(var(--muted-foreground))]">Loading…</p>
            }
          >
            <CompleteRegistrationForm />
          </Suspense>
          <div className="mt-6 pt-5 border-t text-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors min-h-11"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Sign up
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
