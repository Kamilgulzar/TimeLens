import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { resendVerificationCode } from "@/lib/api";
import { ArrowLeft, Loader2 } from "lucide-react";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@");
  if (!domain || !localPart) return email;
  const visible = localPart.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(localPart.length - 2, 0))}@${domain}`;
}

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

  useEffect(() => {
    focus(0);
  }, [focus]);

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
    setCode((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < OTP_LENGTH - 1) {
      focus(index + 1);
    }
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
    [...pasted].forEach((digit, i) => {
      next[i] = digit;
    });
    setCode(next);
    focus(Math.min(pasted.length, OTP_LENGTH - 1));
  };

  return (
    <div className="flex items-center justify-between gap-2.5">
      {code.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
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

export default function VerifyEmail() {
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const otpRef = useRef<{ reset: () => void }>(null);

  useEffect(() => {
    if (!email) {
      navigate("/signup", { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const submit = async (value: string) => {
    if (!value || value.length !== OTP_LENGTH || !email) return;
    setIsVerifying(true);
    setError("");
    try {
      await verifyEmail(email, value);
      navigate("/", { replace: true });
    } catch (err) {
      const res = (
        err as {
          response?: { data?: { error?: string } };
          message?: string;
        }
      );
      setError(
        res?.response?.data?.error ||
          res?.message ||
          "Verification failed. Please try again."
      );
      setCode("");
      otpRef.current?.reset();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (isResending || cooldown > 0 || !email) return;
    setIsResending(true);
    setError("");
    setNotice("");
    try {
      await resendVerificationCode(email);
      setNotice("A new code has been sent to your email.");
      setCooldown(RESEND_COOLDOWN);
      setCode("");
      otpRef.current?.reset();
    } catch (err) {
      const res = (
        err as {
          response?: { data?: { error?: string } };
          message?: string;
        }
      );
      setError(
        res?.response?.data?.error ||
          res?.message ||
          "Failed to resend code. Please try again."
      );
    } finally {
      setIsResending(false);
    }
  };

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

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-[340px] animate-[fadeInUp_0.6s_cubic-bezier(0.32,0.72,0,1)_both]">
          <Link
            to="/signup"
            className="mb-6 inline-flex items-center gap-2 text-[12.5px] font-medium text-[#8B919E] transition-colors duration-200 hover:text-[#F7F8FA]"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
            Back to sign up
          </Link>

          <h1 className="text-[26px] font-bold leading-[1.15] tracking-[-0.03em] text-[#F5F7FA]">
            Verify your email
          </h1>
          <p className="mt-2 text-[14px] leading-[1.55] text-[#8B919E]">
            We sent a verification code to{" "}
            <span className="font-medium text-[#6366F1]">
              {email ? maskEmail(email) : "your email"}
            </span>
            .
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

          <form
            className="mt-6"
            onSubmit={(e) => {
              e.preventDefault();
              submit(code);
            }}
          >
            <OtpInput
              ref={otpRef}
              disabled={isVerifying}
              onValueChange={setCode}
              onComplete={submit}
            />

            <button
              type="submit"
              disabled={isVerifying || code.length !== OTP_LENGTH}
              className={`${primaryButtonClass} mt-5`}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                "Verify Email"
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-[12.5px] text-[#8B919E]">
            Didn't receive the code?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending || cooldown > 0}
              className="font-medium text-[#6366F1] transition-colors duration-200 hover:text-[#4f46e5] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cooldown > 0
                ? `Resend code in ${cooldown}s`
                : isResending
                  ? "Sending…"
                  : "Resend code"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
