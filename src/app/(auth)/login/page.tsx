"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Leaf, LogIn, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { resolvePostLoginPath } from "@/lib/auth-routes";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/services/api";
import { AuthTermsConsent } from "@/components/auth/auth-terms-consent";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [mfaToken, setMfaToken] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"credentials" | "mfa">("credentials");
  const { login, verifyLoginOtp } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    authApi.getProviders().then((res) => setGoogleEnabled(Boolean(res.data?.google))).catch(() => {});
    const err = searchParams.get("error");
    if (err) {
      const messages: Record<string, string> = {
        google_not_configured: "Google sign-in is not configured yet.",
        google_denied: "Google sign-in was cancelled.",
        google_invalid_state: "Google sign-in expired. Please try again.",
        google_auth_failed: "Google sign-in failed. Please try again.",
      };
      toast({
        title: messages[err] ?? "Sign-in failed",
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  const getCallbackUrl = () => {
    if (typeof window === "undefined") return "/";
    return searchParams.get("callbackUrl") ?? "/";
  };

  const finishLogin = (role: "user" | "admin") => {
    const callbackUrl = getCallbackUrl();
    const redirectTo = resolvePostLoginPath(
      role,
      callbackUrl !== "/" ? callbackUrl : null
    );
    toast({ title: "Welcome back! 🏔️", description: "Successfully logged in." });
    router.push(redirectTo);
  };

  const handleGoogleLogin = () => {
    if (!acceptedTerms) {
      toast({
        title: "Please accept Terms & Conditions",
        description: "Read and agree to our Terms and Privacy Policy to continue.",
        variant: "destructive",
      });
      return;
    }
    const callbackUrl = encodeURIComponent(getCallbackUrl());
    window.location.href = `/api/auth/google?callbackUrl=${callbackUrl}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      toast({
        title: "Please accept Terms & Conditions",
        description: "Read and agree to our Terms and Privacy Policy to continue.",
        variant: "destructive",
      });
      return;
    }
    if (!email || !password) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    const result = await login(email, password, getCallbackUrl());
    setIsLoading(false);
    if (!result.success) {
      toast({ title: result.error ?? "Login failed", variant: "destructive" });
      return;
    }
    if (result.requiresMfa) {
      setMfaToken(result.mfaToken);
      setMaskedEmail(result.maskedEmail);
      setStep("mfa");
      toast({
        title: "Verification required",
        description: "We sent a 6-digit code to your email.",
      });
      return;
    }
    finishLogin(result.user?.role ?? "user");
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      toast({ title: "Enter the 6-digit code", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    const result = await verifyLoginOtp(mfaToken, otpCode);
    setIsLoading(false);
    if (!result.success) {
      toast({ title: result.error ?? "Invalid code", variant: "destructive" });
      return;
    }
    finishLogin(result.user?.role ?? "user");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
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
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-black/20 to-transparent" />
      </div>

      <div className="flex items-center justify-center p-6 md:p-12 bg-[hsl(var(--background))]">
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 rounded-2xl gradient-forest flex items-center justify-center mx-auto mb-3">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gradient">BharmouriRoots</h1>
          </div>

          {step === "credentials" ? (
            <>
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
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <AuthTermsConsent
                  id="login-terms"
                  checked={acceptedTerms}
                  onCheckedChange={setAcceptedTerms}
                />

                <Button type="submit" size="lg" className="w-full gap-2" disabled={isLoading || !acceptedTerms}>
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" /> Sign In
                    </>
                  )}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[hsl(var(--background))] px-3 text-xs text-[hsl(var(--muted-foreground))]">
                    OR CONTINUE WITH
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="gap-2 w-full"
                disabled={!googleEnabled || !acceptedTerms}
                onClick={handleGoogleLogin}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill="#EA4335"
                    d="M12 10.2v3.6h5.1c-.2 1.2-1.6 3.5-5.1 3.5-3.1 0-5.6-2.6-5.6-5.8S8.9 5.7 12 5.7c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.9 3.4 14.7 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12s4.3 9.5 9.5 9.5c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.5H12z"
                  />
                </svg>
                Continue with Google
              </Button>
            </>
          ) : (
            <form onSubmit={handleVerifyMfa} className="space-y-5">
              <div className="text-center mb-2">
                <div className="w-14 h-14 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck className="w-7 h-7 text-[hsl(var(--primary))]" />
                </div>
                <h2 className="text-2xl font-bold mb-1">Verify it&apos;s you</h2>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Enter the 6-digit code sent to{" "}
                  <span className="font-medium text-[hsl(var(--foreground))]">{maskedEmail}</span>
                </p>
              </div>

              <div>
                <Label className="mb-1.5 block">Verification code</Label>
                <Input
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  required
                  className="h-12 text-center text-xl tracking-[0.4em] font-semibold"
                  autoComplete="one-time-code"
                />
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={isLoading || otpCode.length !== 6}>
                {isLoading ? "Verifying..." : "Verify & sign in"}
              </Button>

              <button
                type="button"
                className="w-full text-sm text-[hsl(var(--primary))] hover:underline"
                disabled={isLoading}
                onClick={() => {
                  setStep("credentials");
                  setOtpCode("");
                  setMfaToken("");
                }}
              >
                Back to password
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPageRoute() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}
