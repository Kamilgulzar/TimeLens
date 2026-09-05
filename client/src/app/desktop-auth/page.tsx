"use client";

import { Suspense, useEffect, use, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

function DesktopAuthInner() {
  const searchParams = use(useSearchParams());
  const router = useRouter();
  const { signIn, isLoaded } = useSignIn();
  const provider = searchParams.get("provider") as "google" | "github" | null;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !signIn || !provider) return;

    if (provider !== "google" && provider !== "github") {
      setError("Invalid OAuth provider. Close this window and try again.");
      return;
    }

    const strategy = provider === "google" ? "oauth_google" : "oauth_github";

    sessionStorage.setItem("timelens_source", "desktop");
    sessionStorage.setItem("timelens_oauth", provider);
    sessionStorage.setItem(
      "timelens_extension_redirect",
      "timelens://auth"
    );

    signIn
      .authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/sso-callback",
      })
      .catch(() => {
        setError("Failed to start OAuth. Close this window and try again.");
      });
  }, [isLoaded, signIn, provider, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFC] dark:bg-[#0C0C10]">
        <div className="flex flex-col items-center gap-4">
          <p className="text-[14px] text-[#EF4444]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFC] dark:bg-[#0C0C10]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-7 w-7 animate-spin text-[#6366F1]" strokeWidth={1.5} />
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
          <Loader2 className="h-7 w-7 animate-spin text-[#6366F1]" strokeWidth={1.5} />
        </div>
      }
    >
      <DesktopAuthInner />
    </Suspense>
  );
}
