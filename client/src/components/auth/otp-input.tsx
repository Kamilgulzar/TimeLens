"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

const OTP_LENGTH = 6;

export interface OtpInputHandle {
  reset: () => void;
}

interface OtpInputProps {
  disabled?: boolean;
  onComplete: (code: string) => void;
  onValueChange?: (value: string) => void;
}

export const OtpInput = forwardRef<OtpInputHandle, OtpInputProps>(function OtpInput(
  { disabled, onComplete, onValueChange },
  ref
) {
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
          className="h-12 w-full max-w-[48px] rounded-[12px] border border-[#E7E8ED] bg-white text-center text-[18px] font-semibold text-[#111827] outline-none transition-all duration-150 placeholder:text-[#9CA3AF] focus:border-[#7375FF] focus:ring-4 focus:ring-[#7375FF]/10 dark:border-[#262B36] dark:bg-[#12161F] dark:text-[#F5F7FA] dark:placeholder:text-[#6B7280] disabled:opacity-60"
        />
      ))}
    </div>
  );
});
