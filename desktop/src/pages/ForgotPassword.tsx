import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { forgotPassword, resetPassword } from "@/lib/api";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;
const PASSWORD_MIN = 8;

const inputBase =
  "peer h-12 w-full rounded-[12px] border border-[#E7E8ED] bg-white dark:border-[#262B36] dark:bg-[#12161F] px-4 text-[15px] text-[#111318] dark:text-[#F5F7FA] outline-none transition-all duration-150 placeholder:text-[#9CA3AF] dark:placeholder:text-[#6B7280] focus:border-[#7375FF] focus:ring-4 focus:ring-[#7375FF]/10 disabled:cursor-not-allowed disabled:opacity-60";

const primaryButtonClass =
  "group inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[#0F172A] text-[15px] font-semibold text-white transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#1e293b] hover:shadow-[0_10px_28px_rgba(15,23,42,0.18)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#F7F8FA] dark:text-[#111827] dark:hover:bg-[#E5E7EB] dark:hover:shadow-[0_10px_28px_rgba(0,0,0,0.32)]";

const OtpInput = forwardRef<{ reset: () => void }, {
  disabled?: boolean;
  onValueChange?: (value: string) => void;
  onComplete: (code: string) => void;
}>(function OtpInput({ disabled, onValueChange, onComplete }, ref) {
  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const completedRef = useRef(false);
  const prevValueRef = useRef("");

  useImperativeHandle(ref, () => ({
    reset: () => {
      completedRef.current = false;
      prevValueRef.current = "";
      setCode(Array(OTP_LENGTH).fill(""));
      inputsRef.current[0]?.focus();
    },
  }));

  const focus = useCallback((index: number) => {
    if (index >= 0 && index < OTP_LENGTH) {
      inputsRef.current[index]?.focus();
    }
  }, []);

  useEffect(() => { focus(0); }, [focus]);

  const codeValue = code.join("");

  useEffect(() => {
    if (onValueChange) onValueChange(codeValue);
    if (
      codeValue.length === OTP_LENGTH &&
      prevValueRef.current.length !== OTP_LENGTH &&
      !completedRef.current
    ) {
      completedRef.current = true;
      onComplete(codeValue);
    }
    prevValueRef.current = codeValue;
  }, [codeValue, onValueChange, onComplete]);

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setCode((prev) => { const next = [...prev]; next[index] = digit; return next; });
    if (digit && index < OTP_LENGTH - 1) focus(index + 1);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      e.preventDefault();
      focus(index - 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill("");
    [...pasted].forEach((digit, i) => { next[i] = digit; });
    setCode(next);
    focus(Math.min(pasted.length, OTP_LENGTH - 1));
  };

  return (
    <div className="flex items-center justify-between gap-2.5">
      {code.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { inputsRef.current[index] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={2}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
          className="h-12 w-full max-w-[48px] rounded-[12px] border border-[#262B36] bg-[#12161F] text-center text-[18px] font-semibold text-[#F5F7FA] outline-none transition-all duration-150 placeholder:text-[#6B7280] focus:border-[#7375FF] focus:ring-4 focus:ring-[#7375FF]/10 disabled:opacity-60"
        />
      ))}
    </div>
  );
});

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";

  const [step, setStep] = useState<"request" | "reset">(email ? "reset" : "request");
  const [inputEmail, setInputEmail] = useState(email);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const otpRef = useRef<{ reset: () => void }>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!inputEmail) { setError("Email is required."); return; }

    setIsSubmitting(true);
    try {
      await forgotPassword(inputEmail.trim().toLowerCase());
      setNotice("If an account exists, a reset code has been sent.");
      setStep("reset");
      setCooldown(RESEND_COOLDOWN);
    } catch {
      setNotice("If an account exists, a reset code has been sent.");
      setStep("reset");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword(otpCode: string) {
    if (!otpCode || otpCode.length !== OTP_LENGTH) return;
    setError("");
    setIsSubmitting(true);
    try {
      if (!newPassword || newPassword.length < PASSWORD_MIN) {
        setError(`Password must be at least ${PASSWORD_MIN} characters.`);
        setIsSubmitting(false);
        return;
      }
      await resetPassword(inputEmail.trim().toLowerCase(), otpCode, newPassword);
      navigate("/login", { replace: true });
    } catch (err) {
      const res = (err as { response?: { data?: { error?: string } } });
      setError(res?.response?.data?.error || "Reset failed. Please try again.");
      setCode("");
      otpRef.current?.reset();
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleResend = async () => {
    if (cooldown > 0) return;
    setNotice("");
    setError("");
    try {
      await forgotPassword(inputEmail.trim().toLowerCase());
      setNotice("A new code has been sent to your email.");
      setCooldown(RESEND_COOLDOWN);
      setCode("");
      otpRef.current?.reset();
    } catch {
      setNotice("A new code has been sent to your email.");
      setCooldown(RESEND_COOLDOWN);
    }
  };

  return (
    <div className="relative flex h-[100dvh] flex-col bg-[#080A0F] overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute -top-40 left-1/2 h-[400px] w-[500px] -translate-x-1/2 rounded-full opacity-[0.12]"
          style={{ background: "radial-gradient(closest-side, #B9BFF5, transparent 70%)", filter: "blur(50px)" }}
        />
      </div>

      <div className="relative z-10 flex shrink-0 justify-center pt-6 pb-1">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="TimeLens" className="h-7 w-7 object-contain" />
          <span className="text-[14px] font-semibold text-[#F5F7FA] tracking-[-0.01em]">TimeLens</span>
        </div>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-[340px] animate-[fadeInUp_0.6s_cubic-bezier(0.32,0.72,0,1)_both]">
          <Link to="/login" className="mb-6 inline-flex items-center gap-2 text-[12.5px] font-medium text-[#8B919E] transition-colors duration-200 hover:text-[#F7F8FA]">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
            Back to sign in
          </Link>

          <h1 className="text-[26px] font-bold leading-[1.15] tracking-[-0.03em] text-[#F5F7FA]">
            {step === "request" ? "Reset your password" : "Enter reset code"}
          </h1>
          <p className="mt-2 text-[14px] leading-[1.55] text-[#8B919E]">
            {step === "request"
              ? "Enter your email and we'll send you a reset code."
              : `Enter the code sent to ${inputEmail} and your new password.`
            }
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-red-900/40 bg-red-900/20 px-3.5 py-2.5 text-[12.5px] text-red-400">
              {error}
            </div>
          )}

          {notice && (
            <div className="mt-4 rounded-xl border border-green-900/40 bg-green-900/20 px-3.5 py-2.5 text-[12.5px] text-green-400">
              {notice}
            </div>
          )}

          {step === "request" ? (
            <form onSubmit={handleRequestCode} className="mt-5 space-y-3">
              <input
                type="email"
                placeholder="Email address"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                required
                className={inputBase}
                autoComplete="email"
              />
              <button type="submit" disabled={isSubmitting} className={`${primaryButtonClass} mt-1`}>
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                ) : "Send Reset Code"}
              </button>
            </form>
          ) : (
            <div className="mt-5 space-y-4">
              <OtpInput
                ref={otpRef}
                disabled={isSubmitting}
                onValueChange={setCode}
                onComplete={(c) => { setCode(c); }}
              />

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className={`${inputBase} pr-12`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#9CA3AF] transition-colors duration-200 hover:text-[#F7F8FA]"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.5} /> : <Eye className="h-[18px] w-[18px]" strokeWidth={1.5} />}
                </button>
              </div>

              <button
                onClick={() => handleResetPassword(code)}
                disabled={isSubmitting || code.length !== OTP_LENGTH || !newPassword}
                className={primaryButtonClass}
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Resetting…</>
                ) : "Reset Password"}
              </button>

              <p className="text-center text-[12.5px] text-[#8B919E]">
                Didn't receive the code?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0}
                  className="font-medium text-[#6366F1] transition-colors duration-200 hover:text-[#4f46e5] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
