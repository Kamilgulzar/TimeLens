"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useClerkOtp } from "@/lib/clerk-otp";
import { OtpInput } from "@/components/auth/otp-input";
import { inputBase, primaryButtonClass } from "@/components/auth/auth-styles";

const RESEND_COOLDOWN = 30;

type Step = "email" | "code" | "password";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(local.length - 2, 0))}@${domain}`;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const {
    isLoaded: clerkReady,
    clerkError,
    sendResetCode,
    verifyResetCode,
    resendResetCode,
  } = useClerkOtp();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const otpRef = useRef<{ reset: () => void }>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!clerkReady) {
      setError("Sign-in is still loading. Please try again.");
      return;
    }
    setIsSubmitting(true);
    try {
      await sendResetCode(email);
      setStep("code");
    } catch (err: unknown) {
      setError(clerkError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitCode = async (value: string) => {
    if (isSubmitting || value.length !== 6) return;
    setIsSubmitting(true);
    setError("");
    try {
      await verifyResetCode(value);
      setCode(value);
      setStep("password");
    } catch (err: unknown) {
      setError(clerkError(err));
      otpRef.current?.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (isResending || cooldown > 0) return;
    setIsResending(true);
    setError("");
    setNotice("");
    try {
      await resendResetCode();
      setNotice("A new code has been sent to your email.");
      setCooldown(RESEND_COOLDOWN);
      otpRef.current?.reset();
    } catch (err: unknown) {
      setError(clerkError(err));
    } finally {
      setIsResending(false);
    }
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match. Please try again.");
      return;
    }
    setIsSubmitting(true);
    try {
      await resetPassword(email, password);
      router.push("/login?reset=success");
     } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const heading = {
    email: "Reset your password",
    code: "Enter verification code",
    password: "Set a new password",
  }[step];

  const description = {
    email: "Enter your email address and we'll send you a 6-digit code to reset your password.",
    code: `We sent a 6-digit code to ${maskEmail(email)}.`,
    password: "Your new password must be at least 6 characters long.",
  }[step];

  return (
    <div className="w-full animate-[fadeInUp_0.6s_cubic-bezier(0.32,0.72,0,1)_both]">
      <Link
        href="/login"
        className="mb-8 inline-flex items-center gap-2 text-[13.5px] font-medium text-[#5B6475] dark:text-[#8B919E] transition-colors duration-200 hover:text-[#111827] dark:hover:text-[#F7F8FA]"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        Back to sign in
      </Link>

      <h1 className="text-[30px] sm:text-[34px] font-bold leading-[1.15] tracking-[-0.03em] text-[#111318] dark:text-[#F5F7FA]">
        {heading}
      </h1>
      <p className="mt-3 max-w-[360px] text-[15.5px] leading-[1.65] text-[#5B6475] dark:text-[#8B919E]">
        {description}
      </p>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200/80 bg-red-50/80 dark:border-red-900/40 dark:bg-red-900/20 px-4 py-3 text-[13.5px] text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {notice && (
        <div className="mt-6 rounded-xl border border-green-200/80 bg-green-50/80 dark:border-green-900/40 dark:bg-green-900/20 px-4 py-3 text-[13.5px] text-green-700 dark:text-green-400">
          {notice}
        </div>
      )}

      {step === "email" && (
        <form onSubmit={submitEmail} className="mt-8 space-y-4">
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#9CA3AF] transition-colors duration-200 peer-focus:text-[#7375FF]"
              strokeWidth={1.5}
            />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`${inputBase} pl-12`}
              autoComplete="email"
            />
          </div>
          <div id="clerk-captcha" />
          <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending code…
              </>
            ) : (
              "Send reset code"
            )}
          </button>
        </form>
      )}

      {step === "code" && (
        <form
          className="mt-8"
          onSubmit={(e) => {
            e.preventDefault();
            submitCode(code);
          }}
        >
          <OtpInput
            ref={otpRef}
            disabled={isSubmitting}
            onValueChange={setCode}
            onComplete={submitCode}
          />
          <button type="submit" disabled={isSubmitting || code.length !== 6} className={`${primaryButtonClass} mt-5`}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying…
              </>
            ) : (
              "Verify Code"
            )}
          </button>
          <p className="mt-6 text-center text-[13.5px] text-[#5B6475] dark:text-[#8B919E]">
            Didn&apos;t receive the code?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending || cooldown > 0}
              className="font-medium text-[#6366F1] transition-colors duration-200 hover:text-[#4f46e5] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : isResending ? "Sending…" : "Resend code"}
            </button>
          </p>
        </form>
      )}

      {step === "password" && (
        <form onSubmit={submitPassword} className="mt-8 space-y-4">
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#9CA3AF] transition-colors duration-200 peer-focus:text-[#7375FF]"
              strokeWidth={1.5}
            />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className={`${inputBase} pr-12 pl-12`}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#9CA3AF] transition-colors duration-200 hover:text-[#111827] dark:hover:text-[#F7F8FA]"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.5} />
              ) : (
                <Eye className="h-[18px] w-[18px]" strokeWidth={1.5} />
              )}
            </button>
          </div>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#9CA3AF] transition-colors duration-200 peer-focus:text-[#7375FF]"
              strokeWidth={1.5}
            />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className={`${inputBase} pr-12 pl-12`}
              autoComplete="new-password"
            />
          </div>
          <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Resetting…
              </>
            ) : (
              "Reset password"
            )}
          </button>
        </form>
      )}
    </div>
  );
}