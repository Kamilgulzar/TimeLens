"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useClerk, useSignIn } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

function setDesktopCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=600;SameSite=Lax`;
}

function DesktopAuthInner() {
  const searchParams = useSearchParams();
  const { loaded } = useClerk();
  const { signIn } = useSignIn();
  const provider = searchParams.get("provider") as "google" | "github" | null;
  const [error, setError] = useState<string | null>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!loaded || !signIn || hasRun.current) return;
    hasRun.current = true;

    if (!provider || (provider !== "google" && provider !== "github")) {
      setError("Invalid OAuth provider. Close this window and try again.");
      return;
    }

    const strategy = provider === "google" ? "oauth_google" : "oauth_github";

    sessionStorage.setItem("timelens_source", "desktop");
    sessionStorage.setItem("timelens_oauth", provider);
    sessionStorage.setItem("timelens_extension_redirect", "timelens://auth");

    setDesktopCookie("timelens_source", "desktop");
    setDesktopCookie("timelens_oauth", provider);
    setDesktopCookie("timelens_extension_redirect", "timelens://auth");

    signIn
      .create({
        strategy,
        redirectUrl: "/sso-callback",
        actionCompleteRedirectUrl: "/sso-callback",
      })
      .then((res) => {
        if (res.error) throw res.error;

        const url =
          signIn.firstFactorVerification?.externalVerificationRedirectURL;
        if (!url) {
          setError("Failed to start OAuth: no redirect URL returned.");
          return;
        }

        setDesktopCookie("timelens_source", "desktop");
        setDesktopCookie("timelens_oauth", provider);
        setDesktopCookie("timelens_extension_redirect", "timelens://auth");

        window.location.href = url.toString();
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        setError(`Failed to start OAuth: ${msg}`);
      });
  }, [loaded, signIn, provider]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFC] dark:bg-[#0C0C10]">
        <div className="flex flex-col items-center gap-4 max-w-md text-center px-6">
          <p className="text-[14px] text-[#EF4444]">{error}</p>
          <p className="text-[12px] text-[#98A2B3]">
            Close this window and try again from the desktop app.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFC] dark:bg-[#0C0C10]">
      <div className="flex flex-col items-center gap-4">
        <Loader2
          className="h-7 w-7 animate-spin text-[#6366F1]"
          strokeWidth={1.5}
        />
        <p className="text-[14px] text-[#667085] dark:text-[#98A2B3]">
          Opening {provider === "github" ? "GitHub" : "Google"} sign-in…
        </p>
        <p className="text-[12px] text-[#98A2B3]">
          You will be redirected back to the desktop app after signing in.
        </p>
      </div>
    </div>
  );
}

export default function DesktopAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FAFAFC] dark:bg-[#0C0C10]">
          <Loader2
            className="h-7 w-7 animate-spin text-[#6366F1]"
            strokeWidth={1.5}
          />
        </div>
      }
    >
      <DesktopAuthInner />
    </Suspense>
  );
}
