"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useClerk, useSignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function ExtensionOAuthInner() {
  const { loaded } = useClerk();
  const { signIn } = useSignIn();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!loaded || !signIn || hasRun.current) return;
    hasRun.current = true;

    const provider = searchParams.get("provider") as "google" | "github" | null;
    const redirect = searchParams.get("redirect");

    if (!provider || !redirect) {
      setError("Missing provider or redirect parameter.");
      return;
    }

    sessionStorage.setItem("timelens_extension_redirect", redirect);
    sessionStorage.setItem("timelens_oauth", provider);
    sessionStorage.setItem("timelens_source", "extension");

    const strategy = provider === "github" ? "oauth_github" as const : "oauth_google" as const;

    signIn
      .create({
        strategy,
        redirectUrl: "/sso-callback",
        actionCompleteRedirectUrl: "/sso-callback",
      })
      .then((res) => {
        if (res.error) throw res.error;

        const verificationUrl =
          signIn.firstFactorVerification?.externalVerificationRedirectURL;
        if (verificationUrl) {
          window.location.href = verificationUrl.toString();
        } else {
          setError("Failed to start OAuth flow.");
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to start OAuth flow.");
      });
  }, [loaded, signIn, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFC] dark:bg-[#0C0C10]">
      <div className="flex flex-col items-center gap-4">
        {error ? (
          <p className="text-[14px] text-[#EF4444]">{error}</p>
        ) : (
          <>
            <Loader2
              className="h-7 w-7 animate-spin text-[#6366F1]"
              strokeWidth={1.5}
            />
            <p className="text-[14px] text-[#667085] dark:text-[#98A2B3]">
              Starting sign-in…
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function ExtensionOAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FAFAFC] dark:bg-[#0C0C10]">
          <Loader2 className="h-7 w-7 animate-spin text-[#6366F1]" strokeWidth={1.5} />
        </div>
      }
    >
      <ExtensionOAuthInner />
    </Suspense>
  );
}
