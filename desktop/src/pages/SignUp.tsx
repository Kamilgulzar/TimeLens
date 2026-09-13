import { useMemo, useState, useEffect, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const NAME_MIN = 2;
const FIRST_NAME_MAX = 15;
const LAST_NAME_MAX = 20;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

const inputBase =
  "peer h-12 w-full rounded-[12px] border border-[#E7E8ED] bg-white dark:border-[#262B36] dark:bg-[#12161F] px-4 text-[15px] text-[#111318] dark:text-[#F5F7FA] outline-none transition-all duration-150 placeholder:text-[#9CA3AF] dark:placeholder:text-[#6B7280] focus:border-[#7375FF] focus:ring-4 focus:ring-[#7375FF]/10 disabled:cursor-not-allowed disabled:opacity-60";

const primaryButtonClass =
  "group inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[#0F172A] text-[15px] font-semibold text-white transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#1e293b] hover:shadow-[0_10px_28px_rgba(15,23,42,0.18)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#F7F8FA] dark:text-[#111827] dark:hover:bg-[#E5E7EB] dark:hover:shadow-[0_10px_28px_rgba(0,0,0,0.32)]";

const socialButtonClass =
  "inline-flex h-12 items-center justify-center gap-2.5 rounded-[12px] border border-[#E7E8ED] bg-white dark:border-[#262B36] dark:bg-[#12161F] text-[14px] font-medium text-[#111318] dark:text-[#F5F7FA] transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#98A2B3] hover:bg-[#F7F8FA] hover:-translate-y-0.5 dark:hover:border-[#4B5563] dark:hover:bg-[#1A1D24] disabled:cursor-not-allowed disabled:opacity-60";

function GoogleIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06L5.84 9.9c.87-2.6 3.3-4.52 6.16-4.52Z" />
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
  return {
    score,
    ...(map as Record<number, { label: string; color: string }>)[score],
  } as { score: number; label: string; color: string };
}

function PasswordStrength({ password }: { password: string }) {
  const { score, label, color } = useMemo(
    () => evaluateStrength(password),
    [password]
  );
  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1.5">
        {([0, 1, 2, 3] as const).map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-colors duration-300"
            style={{ backgroundColor: i < score ? color : "#3A3D45" }}
          />
        ))}
      </div>
      <p className="text-[12px] font-medium" style={{ color }}>
        {label}
      </p>
    </div>
  );
}

function nameError(value: string, label: string, max: number): string | null {
  const v = value.trim();
  if (v.length === 0) return `${label} is required`;
  if (v.length < NAME_MIN)
    return `${label} must be at least ${NAME_MIN} characters`;
  if (v.length > max) return `${label} must be at most ${max} characters`;
  return null;
}

function emailError(value: string): string | null {
  if (!value) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    return "Enter a valid email address";
  return null;
}

function passwordError(value: string): string | null {
  if (!value) return "Password is required";
  if (value.length < PASSWORD_MIN)
    return `Password must be at least ${PASSWORD_MIN} characters`;
  if (value.length > PASSWORD_MAX)
    return `Password must be at most ${PASSWORD_MAX} characters`;
  if (!/[a-z]/.test(value))
    return "Password must include a lowercase letter";
  if (!/[A-Z]/.test(value))
    return "Password must include an uppercase letter";
  if (!/\d/.test(value)) return "Password must include a number";
  return null;
}

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

export default function SignUp() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    api.onOAuthToken(async (token: string) => {
      try {
        await api.me(token);
        localStorage.setItem("timelens-desktop-token", token);
        window.location.reload();
      } catch {
        setError("OAuth signup failed. Please try again.");
        setOauthLoading(null);
      }
    });

    api.onOAuthError((err: string) => {
      setError(err || "OAuth signup failed.");
      setOauthLoading(null);
    });

    return () => {
      api.removeOAuthTokenListener();
      api.removeOAuthErrorListener();
    };
  }, []);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const markTouched = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  const fErr = nameError(firstName, "First name", FIRST_NAME_MAX);
  const lErr = nameError(lastName, "Last name", LAST_NAME_MAX);
  const eErr = emailError(email);
  const pErr = passwordError(password);
  const cpErr =
    confirmPassword && confirmPassword !== password
      ? "Passwords don't match"
      : null;

  const showFErr = touched.firstName ? fErr : null;
  const showLErr = touched.lastName ? lErr : null;
  const showEErr = touched.email ? eErr : null;
  const showPErr = touched.password ? pErr : null;
  const showCPErr = touched.confirmPassword ? cpErr : null;

  const canSubmit =
    !fErr &&
    !lErr &&
    !eErr &&
    !pErr &&
    !cpErr &&
    firstName.trim() &&
    lastName.trim() &&
    email &&
    password &&
    confirmPassword;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const fe = nameError(firstName, "First name", FIRST_NAME_MAX);
    const le = nameError(lastName, "Last name", LAST_NAME_MAX);
    const ee = emailError(email);
    const pe = passwordError(password);

    if (fe || le) {
      setError("Please enter your first and last name.");
      return;
    }
    if (ee) {
      setError(ee);
      return;
    }
    if (pe) {
      setError(pe);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match. Please try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const minimumDelay = new Promise((resolve) => setTimeout(resolve, 700));
      const registerPromise = register(
        firstName.trim(),
        lastName.trim(),
        email.trim().toLowerCase(),
        password
      );
      const [result] = await Promise.all([registerPromise, minimumDelay]);

      navigate(`/verify-email?email=${encodeURIComponent(result.email)}`);
    } catch (err) {
      const res = (
        err as {
          response?: {
            status?: number;
            data?: { email?: string; error?: string };
          };
        }
      )?.response;
      if (res?.status === 409) {
        setError("This email is already registered. Please sign in instead.");
        return;
      }
      setError(res?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOAuth(provider: "google" | "github") {
    const api = window.electronAPI;
    if (!api) {
      setError("OAuth is only available in the desktop app.");
      return;
    }
    setOauthLoading(provider);
    setError("");

    api.oauth(provider);

    setTimeout(() => {
      setOauthLoading(null);
    }, 5000);
  }

  return (
    <div className="relative flex h-[100dvh] flex-col bg-[#080A0F] overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute -top-40 left-1/2 h-[400px] w-[500px] -translate-x-1/2 rounded-full opacity-[0.12]"
          style={{
            background:
              "radial-gradient(closest-side, #B9BFF5, transparent 70%)",
            filter: "blur(50px)",
          }}
        />
      </div>

      <div className="relative z-10 flex shrink-0 justify-center pt-6 pb-1">
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="TimeLens"
            className="h-7 w-7 object-contain"
          />
          <span className="text-[14px] font-semibold text-[#F5F7FA] tracking-[-0.01em]">
            TimeLens
          </span>
        </div>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center px-6 pt-4">
        <div className="w-full max-w-[340px] animate-[fadeInUp_0.6s_cubic-bezier(0.32,0.72,0,1)_both]">
          <h1 className="text-[26px] font-bold leading-[1.15] tracking-[-0.03em] text-[#F5F7FA]">
            Create your account
          </h1>
          <p className="mt-2 text-[14px] leading-[1.55] text-[#8B919E]">
            Create your TimeLens account to start understanding your work.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-3">
            {error && (
              <div className="rounded-xl border border-red-900/40 bg-red-900/20 px-3.5 py-2.5 text-[12.5px] text-red-400">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <div className="relative">
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onBlur={() => markTouched("firstName")}
                  maxLength={FIRST_NAME_MAX}
                  required
                  className={`${inputBase} ${showFErr ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : ""}`}
                  autoComplete="given-name"
                />
                <FieldIcon ok={!showFErr} error={showFErr} />
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
                  className={`${inputBase} ${showLErr ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : ""}`}
                  autoComplete="family-name"
                />
                <FieldIcon ok={!showLErr} error={showLErr} />
              </div>
            </div>

            <div className="relative">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => markTouched("email")}
                required
                className={`${inputBase} ${showEErr ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : ""}`}
                autoComplete="email"
              />
              <FieldIcon ok={!showEErr} error={showEErr} />
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => markTouched("password")}
                required
                maxLength={PASSWORD_MAX}
                className={`${inputBase} pr-12 ${showPErr ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : ""}`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#9CA3AF] transition-colors duration-200 hover:text-[#F7F8FA]"
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
            <PasswordStrength password={password} />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => markTouched("confirmPassword")}
                required
                maxLength={PASSWORD_MAX}
                className={`${inputBase} pr-12 ${showCPErr ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : ""}`}
                autoComplete="new-password"
              />
              <FieldIcon ok={!showCPErr} error={showCPErr} />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              className={`${primaryButtonClass} mt-1`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-[5px]" />
                </>
              )}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#262B36]" />
            <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
              Or continue with
            </span>
            <div className="h-px flex-1 bg-[#262B36]" />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={oauthLoading !== null}
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
              disabled={oauthLoading !== null}
              className={socialButtonClass}
            >
              {oauthLoading === "github" ? (
                <Loader2 className="h-[18px] w-[18px] animate-spin text-[#F7F8FA]" strokeWidth={2} />
              ) : (
                <GitHubIcon className="h-[18px] w-[18px] text-[#F7F8FA]" />
              )}
              GitHub
            </button>
          </div>

          <p className="mt-5 text-center text-[12.5px] font-medium text-[#8B919E]">
            Already have an account?{" "}
            <Link
              to="/login"
              className="group inline-flex items-center gap-0.5 font-semibold text-[#6D5DF6] transition-colors duration-200 hover:text-[#5A4BD6]"
            >
              Sign in
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-[3px]" />
            </Link>
          </p>

          <p className="mt-3 text-center text-[11px] leading-[1.6] text-[#6B7280]">
            By continuing, you agree to the{" "}
            <a
              href="#"
              className="font-medium text-[#6366F1] transition-colors hover:text-[#4f46e5]"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="font-medium text-[#6366F1] transition-colors hover:text-[#4f46e5]"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
