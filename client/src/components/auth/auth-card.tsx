"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useClerkOtp } from "@/lib/clerk-otp";
import { inputBase, primaryButtonClass, socialButtonClass } from "@/components/auth/auth-styles";

type Mode = "signup" | "login";

const NAME_MIN = 2;
const FIRST_NAME_MAX = 15;
const LAST_NAME_MAX = 20;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

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

/* ── Password strength ─────────────────────────────────────────── */

function evaluateStrength(pw: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (pw.length >= PASSWORD_MIN) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  const map = {
    0: { label: "Too short", color: "#DC2626" },
    1: { label: "Weak", color: "#F97316" },
    2: { label: "Fair", color: "#EAB308" },
    3: { label: "Strong", color: "#22C55E" },
    4: { label: "Very strong", color: "#16A34A" },
  } as const;
  return { score, ...(map as Record<number, { label: string; color: string }>)[score] };
}

function PasswordStrength({ password }: { password: string }) {
  const { score, label, color } = useMemo(() => evaluateStrength(password), [password]);
  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1.5">
        {([0, 1, 2, 3] as const).map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-colors duration-300"
            style={{
              backgroundColor: i < score ? color : "#E5E7EB",
            }}
          />
        ))}
      </div>
      <p className="text-[12px] font-medium" style={{ color }}>
        {label}
      </p>
    </div>
  );
}

/* ── Validation helpers ─────────────────────────────────────────── */

function nameError(value: string, label: string, max: number): string | null {
  const v = value.trim();
  if (v.length === 0) return `${label} is required`;
  if (v.length < NAME_MIN) return `${label} must be at least ${NAME_MIN} characters`;
  if (v.length > max) return `${label} must be at most ${max} characters`;
  return null;
}

function emailError(value: string): string | null {
  if (!value) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email address";
  return null;
}

function passwordError(value: string): string | null {
  if (!value) return "Password is required";
  if (value.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters`;
  if (value.length > PASSWORD_MAX) return `Password must be at most ${PASSWORD_MAX} characters`;
  if (!/[a-z]/.test(value)) return "Password must include a lowercase letter";
  if (!/[A-Z]/.test(value)) return "Password must include an uppercase letter";
  if (!/\d/.test(value)) return "Password must include a number";
  return null;
}

/* ── Field feedback icon ────────────────────────────────────────── */

function FieldIcon({ ok, error }: { ok: boolean; error: string | null }) {
  if (!error) return null;
  return (
    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2">
      {ok ? (
        <CheckCircle2 className="h-[16px] w-[16px] text-green-500" />
      ) : (
        <AlertCircle className="h-[16px] w-[16px] text-red-400" />
      )}
    </span>
  );
}

/* ── Main component ────────────────────────────────────────────── */

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
    if (resetSuccess) router.replace("/login", { scroll: false });
  }, [resetSuccess, router]);
  useEffect(() => {
    if (verifiedSuccess) router.replace("/login", { scroll: false });
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

  /* Touch / blur tracking for inline errors */
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const markTouched = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  /* Inline errors (signup only, after first blur) */
  const fErr = isSignup && touched.firstName ? nameError(firstName, "First name", FIRST_NAME_MAX) : null;
  const lErr = isSignup && touched.lastName ? nameError(lastName, "Last name", LAST_NAME_MAX) : null;
  const eErr = touched.email ? emailError(email) : null;
  const pErr = isSignup && touched.password ? passwordError(password) : null;
  const cpErr = isSignup && touched.confirmPassword
    ? confirmPassword !== password
      ? "Passwords don't match"
      : null
    : null;

  const canSubmit = isSignup
    ? !fErr && !lErr && !eErr && !pErr && !cpErr && firstName.trim() && lastName.trim() && email && password && confirmPassword
    : !eErr && email && password;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isSignup) {
      const fe = nameError(firstName, "First name", FIRST_NAME_MAX);
      const le = nameError(lastName, "Last name", LAST_NAME_MAX);
      const ee = emailError(email);
      const pe = passwordError(password);
      if (fe || le || ee || pe) {
        setError("Please fix the highlighted fields.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords don't match. Please try again.");
        return;
      }
    } else {
      const ee = emailError(email);
      if (ee) {
        setError(ee);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const minimumDelay = new Promise((resolve) => setTimeout(resolve, 700));
      if (isSignup) {
        const registerPromise = register(firstName.trim(), lastName.trim(), email.trim().toLowerCase(), password);
        const [result] = await Promise.all([registerPromise, minimumDelay]);
        router.push(`/verify-email?email=${encodeURIComponent(result.email)}`);
      } else {
        const loginPromise = login(email.trim().toLowerCase(), password);
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

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-4">
        {error && (
          <div className="rounded-xl border border-red-200/80 bg-red-50/80 dark:border-red-900/40 dark:bg-red-900/20 px-4 py-3 text-[13.5px] text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Name fields */}
        {isSignup && (
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onBlur={() => markTouched("firstName")}
                maxLength={FIRST_NAME_MAX}
                required
                className={`${inputBase} ${fErr ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : ""}`}
                autoComplete="given-name"
              />
              <FieldIcon ok={!fErr} error={fErr} />
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onBlur={() => markTouched("lastName")}
                maxLength={LAST_NAME_MAX}
                required
                className={`${inputBase} ${lErr ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : ""}`}
                autoComplete="family-name"
              />
              <FieldIcon ok={!lErr} error={lErr} />
            </div>
            {fErr && (
              <p className="col-span-1 -mt-2.5 text-[12px] text-red-500">{fErr}</p>
            )}
            {lErr && (
              <p className="col-span-1 -mt-2.5 text-[12px] text-red-500">{lErr}</p>
            )}
          </div>
        )}

        {/* Email */}
        <div className="relative">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => markTouched("email")}
            required
            className={`${inputBase} ${eErr ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : ""}`}
            autoComplete="email"
          />
          <FieldIcon ok={!eErr} error={eErr} />
        </div>
        {eErr && <p className="-mt-2.5 text-[12px] text-red-500">{eErr}</p>}

        {/* Password */}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => markTouched("password")}
            required
            maxLength={PASSWORD_MAX}
            className={`${inputBase} pr-12 ${pErr ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : ""}`}
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
        {isSignup && <PasswordStrength password={password} />}
        {pErr && <p className="-mt-1 text-[12px] text-red-500">{pErr}</p>}

        {/* Confirm password */}
        {isSignup ? (
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => markTouched("confirmPassword")}
              required
              maxLength={PASSWORD_MAX}
              className={`${inputBase} pr-12 ${cpErr ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : ""}`}
              autoComplete="new-password"
            />
            <FieldIcon ok={!cpErr} error={cpErr} />
          </div>
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
        {cpErr && <p className="-mt-2.5 text-[12px] text-red-500">{cpErr}</p>}

        <button type="submit" disabled={isSubmitting || (isSignup && !canSubmit)} className={`${primaryButtonClass} mt-1`}>
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