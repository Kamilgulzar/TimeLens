import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";

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

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        setError("OAuth login failed. Please try again.");
        setOauthLoading(null);
      }
    });

    api.onOAuthError((err: string) => {
      setError(err || "OAuth login failed.");
      setOauthLoading(null);
    });

    return () => {
      api.removeOAuthTokenListener();
      api.removeOAuthErrorListener();
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Email is required.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate("/");
    } catch (err) {
      const res = (
        err as { response?: { status?: number; data?: { email?: string; error?: string } } }
      )?.response;
      if (res?.status === 403 && res?.data?.email) {
        navigate(`/verify-email?email=${encodeURIComponent(res.data.email)}&reason=unverified`);
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
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute -top-40 left-1/2 h-[400px] w-[500px] -translate-x-1/2 rounded-full opacity-[0.12]"
          style={{
            background: "radial-gradient(closest-side, #B9BFF5, transparent 70%)",
            filter: "blur(50px)",
          }}
        />
      </div>

      {/* Logo */}
      <div className="relative z-10 flex shrink-0 justify-center pt-6 pb-1">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="TimeLens" className="h-7 w-7 object-contain" />
          <span className="text-[14px] font-semibold text-[#F5F7FA] tracking-[-0.01em]">
            TimeLens
          </span>
        </div>
      </div>

      {/* Auth form — centered, no scroll */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-[340px] animate-[fadeInUp_0.6s_cubic-bezier(0.32,0.72,0,1)_both]">
          <h1 className="text-[26px] font-bold leading-[1.15] tracking-[-0.03em] text-[#F5F7FA]">
            Welcome back
          </h1>
          <p className="mt-2 text-[14px] leading-[1.55] text-[#8B919E]">
            Sign in to continue understanding how you spend your time.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-3">
            {error && (
              <div className="rounded-xl border border-red-900/40 bg-red-900/20 px-3.5 py-2.5 text-[12.5px] text-red-400">
                {error}
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
                className={`${inputBase} pr-12`}
                autoComplete="current-password"
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

            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-[12.5px] font-medium text-[#8B919E] transition-colors duration-200 hover:text-[#6D5DF6]"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`${primaryButtonClass}`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-[5px]" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#262B36]" />
            <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
              Or continue with
            </span>
            <div className="h-px flex-1 bg-[#262B36]" />
          </div>

          {/* Social buttons */}
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
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="group inline-flex items-center gap-0.5 font-semibold text-[#6D5DF6] transition-colors duration-200 hover:text-[#5A4BD6]"
            >
              Sign up
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-[3px]" />
            </Link>
          </p>

          <p className="mt-3 text-center text-[11px] leading-[1.6] text-[#6B7280]">
            By continuing, you agree to the{" "}
            <a href="#" className="font-medium text-[#6366F1] transition-colors hover:text-[#4f46e5]">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="font-medium text-[#6366F1] transition-colors hover:text-[#4f46e5]">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
