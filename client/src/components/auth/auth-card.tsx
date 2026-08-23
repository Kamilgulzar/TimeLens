"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useClerkOtp } from "@/lib/clerk-otp";
import { inputBase, primaryButtonClass, socialButtonClass } from "@/components/auth/auth-styles";

type Mode = "signup" | "login";

interface AuthCardProps {
  initialMode: Mode;
  resetSuccess?: boolean;
  verifiedSuccess?: boolean;
}

function GoogleIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06L5.84 9.9c.87-2.6 3.3-4.52 6.16-4.52Z"
      />
    </svg>
  );
}

function GitHubIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.91c.58.11.79-.25.79-.55v-2.13c-3.2.7-3.87-1.36-3.87-1.36-.53-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.75 2.69 1.25 3.34.95.11-.74.4-1.25.73-1.53-2.55-.29-5.23-1.28-5.23-5.67 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a11 11 0 0 1 5.74 0c2.18-1.49 3.14-1.18 3.14-1.18.63 1.59.24 2.76.12 3.05.74.8 1.18 1.83 1.18 3.08 0 4.4-2.69 5.37-5.25 5.66.41.35.77 1.05.77 2.12v3.14c0 .3.2.66.8.55A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

export function AuthCard({
  initialMode,
  resetSuccess = false,
  verifiedSuccess = false,
}: AuthCardProps) {
  const isSignup = initialMode === "signup";
  const { login, register } = useAuth();
  const { isLoaded: clerkReady, clerkError, startOAuth } = useClerkOtp();
  const router = useRouter();

  useEffect(() => {
    if (resetSuccess) {
      router.replace("/login", { scroll: false });
    }
  }, [resetSuccess, router]);

  useEffect(() => {
    if (verifiedSuccess) {
      router.replace("/login", { scroll: false });
    }
  }, [verifiedSuccess, router]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isSignup && password !== confirmPassword) {
      setError("Passwords don't match. Please try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const minimumDelay = new Promise((resolve) => setTimeout(resolve, 700));
      if (isSignup) {
        const registerPromise = register(firstName, lastName, email, password);
        const [result] = await Promise.all([registerPromise, minimumDelay]);
        router.push(`/verify-email?email=${encodeURIComponent(result.email)}`);
      } else {
        const loginPromise = login(email, password);
        await Promise.all([loginPromise, minimumDelay]);
      }
    } catch (err) {
      const res = (
        err as { response?: { status?: number; data?: { email?: string; error?: string } } }
      )?.response;
      if (res?.status === 403 && res?.data?.email) {
        router.push(
          `/verify-email?email=${encodeURIComponent(res.data.email)}&reason=unverified`
        );
        return;
      }
      setError(res?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    if (oauthLoading || isSubmitting) return;
    setError("");
    setOauthLoading(provider);
    try {
      // Remember which provider the user picked so /sso-callback knows it.
      window.sessionStorage.setItem("timelens_oauth", provider);
      await startOAuth(provider === "google" ? "oauth_google" : "oauth_github");
    } catch (err: unknown) {
      window.sessionStorage.removeItem("timelens_oauth");
      setError(clerkError(err));
      setOauthLoading(null);
    }
  };

  return (
    <div className="w-full animate-[fadeInUp_0.6s_cubic-bezier(0.32,0.72,0,1)_both]">
      {resetSuccess && (
        <div className="mb-6 rounded-xl border border-green-200/80 bg-green-50/80 dark:border-green-900/40 dark:bg-green-900/20 px-4 py-3 text-left text-[13.5px] leading-[1.5] text-green-700 dark:text-green-400">
          Your password has been reset. Sign in with your new password to continue.
        </div>
      )}
      {verifiedSuccess && (
        <div className="mb-6 rounded-xl border border-green-200/80 bg-green-50/80 dark:border-green-900/40 dark:bg-green-900/20 px-4 py-3 text-left text-[13.5px] leading-[1.5] text-green-700 dark:text-green-400">
          Your email has been verified. Sign in to continue.
        </div>
      )}

      <h1 className="text-[30px] sm:text-[34px] font-bold leading-[1.15] tracking-[-0.03em] text-[#111318] dark:text-[#F5F7FA]">
        {isSignup ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-3 max-w-[360px] text-[15.5px] leading-[1.65] text-[#5B6475] dark:text-[#8B919E]">
        {isSignup
          ? "Create your TimeLens account to start understanding your work."
          : "Sign in to continue understanding how you spend your time."}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {error && (
          <div className="rounded-xl border border-red-200/80 bg-red-50/80 dark:border-red-900/40 dark:bg-red-900/20 px-4 py-3 text-[13.5px] text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {isSignup && (
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className={inputBase}
              autoComplete="given-name"
            />
            <input
              type="text"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className={inputBase}
              autoComplete="family-name"
            />
          </div>
        )}

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={inputBase}
          autoComplete="email"
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={isSignup ? 6 : undefined}
            className={`${inputBase} pr-12`}
            autoComplete={isSignup ? "new-password" : "current-password"}
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

        {isSignup ? (
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className={`${inputBase} pr-12`}
            autoComplete="new-password"
          />
        ) : (
          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-[13px] font-medium text-[#667085] dark:text-[#8B919E] transition-colors duration-200 hover:text-[#6D5DF6]"
            >
              Forgot password?
            </Link>
          </div>
        )}

        <button type="submit" disabled={isSubmitting} className={`${primaryButtonClass} mt-1`}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isSignup ? "Creating account…" : "Signing in…"}
            </>
          ) : (
            <>
              {isSignup ? "Create Account" : "Sign In"}
              <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-[5px]" />
            </>
          )}
        </button>
      </form>

      {/* Social login */}
      <div className="my-7 flex items-center gap-4">
        <div className="h-px flex-1 bg-[#E7E8ED] dark:bg-[#262B36]" />
        <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.14em] text-[#98A2B3] dark:text-[#6B7280]">
          Or continue with
        </span>
        <div className="h-px flex-1 bg-[#E7E8ED] dark:bg-[#262B36]" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleOAuth("google")}
          disabled={oauthLoading !== null || !clerkReady}
          className={socialButtonClass}
        >
          {oauthLoading === "google" ? (
            <Loader2 className="h-[18px] w-[18px] animate-spin text-[#4285F4]" strokeWidth={2} />
          ) : (
            <GoogleIcon className="h-[18px] w-[18px]" />
          )}
          Google
        </button>
        <button
          type="button"
          onClick={() => handleOAuth("github")}
          disabled={oauthLoading !== null || !clerkReady}
          className={socialButtonClass}
        >
          {oauthLoading === "github" ? (
            <Loader2 className="h-[18px] w-[18px] animate-spin text-[#111827] dark:text-[#F7F8FA]" strokeWidth={2} />
          ) : (
            <GitHubIcon className="h-[18px] w-[18px] text-[#111827] dark:text-[#F7F8FA]" />
          )}
          GitHub
        </button>
      </div>

      <p className="mt-7 text-[13.5px] font-medium text-[#5B6475] dark:text-[#8B919E]">
        {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
        <Link
          href={isSignup ? "/login" : "/register"}
          className="group inline-flex items-center gap-1 font-semibold text-[#6D5DF6] transition-colors duration-200 hover:text-[#5A4BD6]"
        >
          {isSignup ? "Sign in" : "Sign up"}
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-[4px]" />
        </Link>
      </p>

      <p className="mt-6 text-left text-[12px] leading-[1.65] text-[#98A2B3] dark:text-[#6B7280]">
        By continuing, you agree to the{" "}
        <a href="#" className="font-medium text-[#6366F1] transition-colors hover:text-[#4f46e5]">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="font-medium text-[#6366F1] transition-colors hover:text-[#4f46e5]">
          Privacy Policy
        </a>.
      </p>
    </div>
  );
}