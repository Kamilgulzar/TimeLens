"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk, useSession } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import BfcacheGuard from "@/components/auth/BfcacheGuard";

function readMarker(key: string): string | null {
  if (typeof window === "undefined") return null;
  const urlVal = new URLSearchParams(window.location.search).get(key);
  if (urlVal) return urlVal;
  const ssVal = window.sessionStorage.getItem(key);
  if (ssVal) return ssVal;
  const match = document.cookie.match(new RegExp("(^| )" + key + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function SSOCallbackInner() {
  const { loaded } = useClerk();
  const { session } = useSession();
  const { oauthSignIn } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    console.log("[sso-callback] effect fired:", { loaded, hasRun: hasRun.current, hasSession: !!session });
    if (!loaded || hasRun.current || !session) return;
    hasRun.current = true;

    const source = readMarker("timelens_source");
    const isExtension = source === "extension" || source === "desktop";
    console.log("[sso-callback] source:", source, "isExtension:", isExtension);

    (async () => {
      try {
        const provider = readMarker("timelens_oauth") as "google" | "github" | null;
        console.log("[sso-callback] provider:", provider);
        if (!provider) throw new Error("Missing OAuth provider.");

        const email = session.user.primaryEmailAddress?.emailAddress
          || session.user.emailAddresses?.[0]?.emailAddress;
        console.log("[sso-callback] email:", email);
        if (!email) throw new Error("No email found in session.");

        const firstName = session.user.firstName ?? undefined;
        const lastName = session.user.lastName ?? undefined;
        const avatar = session.user.imageUrl ?? undefined;

        if (isExtension) {
          const redirectUrl = readMarker("timelens_redirect");
          console.log("[sso-callback] redirectUrl:", redirectUrl);
          if (!redirectUrl) throw new Error("Missing redirect URL.");

          const API_BASE =
            process.env.NEXT_PUBLIC_API_URL || "https://server-liart-xi-18.vercel.app/api";
          const url = `${API_BASE}/auth/extension-oauth`;
          const body = JSON.stringify({ provider, email, firstName, lastName, avatar });
          console.log("[sso-callback] calling API:", url, body);
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          });
          console.log("[sso-callback] API response status:", res.status);
          if (!res.ok) {
            const errBody = await res.json().catch(() => null);
            console.error("[sso-callback] API error body:", errBody);
            throw new Error(errBody?.error ?? `Server error ${res.status}`);
          }
          const { token, user } = await res.json();
          console.log("[sso-callback] got token:", !!token, "user:", !!user);

          const deepLinkUrl = `${redirectUrl}?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(user))}`;
          console.log("[sso-callback] redirecting to:", deepLinkUrl);
          window.location.href = deepLinkUrl;
          return;
        }

        await oauthSignIn({
          provider,
          email,
          firstName,
          lastName,
          avatar,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[sso-callback] Error:", msg);
        if (isExtension) {
          setError(msg);
          return;
        }
        router.replace("/login?oauth=error");
      } finally {
        window.sessionStorage.removeItem("timelens_oauth");
        window.sessionStorage.removeItem("timelens_extension_redirect");
        window.sessionStorage.removeItem("timelens_source");
        document.cookie = "timelens_source=;path=/;max-age=0";
        document.cookie = "timelens_oauth=;path=/;max-age=0";
        document.cookie = "timelens_redirect=;path=/;max-age=0";
      }
    })();
  }, [loaded, session, oauthSignIn, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFC] dark:bg-[#0C0C10]">
        <div className="flex flex-col items-center gap-4 max-w-md text-center px-6">
          <p className="text-[14px] text-[#EF4444]">OAuth failed: {error}</p>
          <p className="text-[12px] text-[#98A2B3]">
            Close this window and try again from the desktop app.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFC] dark:bg-[#0C0C10]">
      <BfcacheGuard />
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-7 w-7 animate-spin text-[#6366F1]" strokeWidth={1.5} />
        <p className="text-[14px] text-[#667085] dark:text-[#98A2B3]">
          Finishing sign in…
        </p>
      </div>
    </div>
  );
}

export default function SSOCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FAFAFC] dark:bg-[#0C0C10]">
          <Loader2 className="h-7 w-7 animate-spin text-[#6366F1]" strokeWidth={1.5} />
        </div>
      }
    >
      <SSOCallbackInner />
    </Suspense>
  );
}
