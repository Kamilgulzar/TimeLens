"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useClerkOtp } from "@/lib/clerk-otp";
import { OtpInput } from "@/components/auth/otp-input";
import { primaryButtonClass } from "@/components/auth/auth-styles";

const RESEND_COOLDOWN = 30;

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(local.length - 2, 0))}@${domain}`;
}

interface VerifyEmailCardProps {
  email: string;
  reason?: string;
}

export function VerifyEmailCard({ email, reason }: VerifyEmailCardProps) {
  const { verifyEmail } = useAuth();
  const {
    isLoaded: clerkReady,
    clerkError,
    sendVerificationCode,
    verifyVerificationCode,
    resendVerificationCode,
  } = useClerkOtp();

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const otpRef = useRef<{ reset: () => void }>(null);
  const sendingRef = useRef(false);

  useEffect(() => {
    if (!clerkReady || sendingRef.current || !email) return;
    sendingRef.current = true;
    sendVerificationCode(email).catch((err: unknown) => {
      setError(clerkError(err));
    });
  }, [clerkReady, email, sendVerificationCode, clerkError]);

  const submit = async (value: string) => {
    if (!value || value.length !== 6) return;
    setIsVerifying(true);
    setError("");
    try {
      await verifyVerificationCode(value);
      await verifyEmail(email);
    } catch (err: unknown) {
      setError(clerkError(err));
      setCode("");
      otpRef.current?.reset();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (isResending || cooldown > 0) return;
    setIsResending(true);
    setError("");
    setNotice("");
    try {
      await resendVerificationCode();
      setNotice("A new code has been sent to your email.");
      setCooldown(RESEND_COOLDOWN);
      setCode("");
      otpRef.current?.reset();
    } catch (err: unknown) {
      setError(clerkError(err));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full animate-[fadeInUp_0.6s_cubic-bezier(0.32,0.72,0,1)_both]">
      <Link
        href="/register"
        className="mb-8 inline-flex items-center gap-2 text-[13.5px] font-medium text-[#5B6475] dark:text-[#8B919E] transition-colors duration-200 hover:text-[#111827] dark:hover:text-[#F7F8FA]"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        Back to sign up
      </Link>

      <h1 className="text-[30px] sm:text-[34px] font-bold leading-[1.15] tracking-[-0.03em] text-[#111318] dark:text-[#F5F7FA]">
        Verify your email
      </h1>
      <p className="mt-3 max-w-[360px] text-[15.5px] leading-[1.65] text-[#5B6475] dark:text-[#8B919E]">
        We sent a verification code to{" "}
        <span className="font-medium text-[#6366F1]">
          {email ? maskEmail(email) : "your email"}
        </span>
        .
      </p>

      {reason === "unverified" && (
        <div className="mt-6 rounded-xl border border-amber-200/80 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-900/20 px-4 py-3 text-[13.5px] leading-[1.5] text-amber-800 dark:text-amber-300">
          An account with this email already exists. Enter the code we sent to
          verify it and continue.
        </div>
      )}

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

      <form
        className="mt-8"
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

        <div id="clerk-captcha" className="mt-4" />

        <button
          type="submit"
          disabled={isVerifying || code.length !== 6}
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
    </div>
  );
}