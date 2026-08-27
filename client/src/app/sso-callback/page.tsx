"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useClerk, useSignIn, useSignUp } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import BfcacheGuard from "@/components/auth/BfcacheGuard";

/**
 * OAuth callback. Clerk redirects the browser here after the user authenticates
 * with Google or GitHub.
 *
 * - Normal flow (no source param): hands identity to /auth/oauth → session cookie → dashboard.
 * - Extension flow (source=extension): calls /auth/extension-oauth → token in body →
 *   redirects to chromiumapp.org with token + user for the extension to capture.
 */
function SSOCallbackInner() {
  const { loaded } = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { oauthSignIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasRun = useRef(false);

  useEffect(() => {
    if (!loaded || hasRun.current) return;
    hasRun.current = true;

    const source = searchParams.get("source");
    const isExtension = source === "extension";

    (async () => {
      try {
        const provider = (typeof window !== "undefined"
          ? window.sessionStorage.getItem("timelens_oauth")
          : null) as "google" | "github" | null;

        if (!provider) throw new Error("Missing OAuth provider.");

        let email: string | null = null;
        let firstName: string | undefined;
        let lastName: string | undefined;
        let avatar: string | undefined;

        // Existing identity (Clerk user already exists).
        if (signIn.status === "complete" && signIn.identifier) {
          email = signIn.identifier;
          firstName = signIn.userData?.firstName;
          lastName = signIn.userData?.lastName;
          avatar = signIn.userData?.imageUrl;
        }

        // New identity: transfer the sign-in into a sign-up.
        if (!email && signIn.isTransferable) {
          const res = await signUp.create({ transfer: true });
          if (res.error) throw res.error;
        }

        if (!email && signUp.emailAddress) {
          email = signUp.emailAddress;
          firstName = firstName ?? signUp.firstName ?? undefined;
          lastName = lastName ?? signUp.lastName ?? undefined;
        }

        if (!email) throw new Error("OAuth flow did not produce an email.");

        if (isExtension) {
          // Extension flow: call /auth/extension-oauth to get token + user in body,
          // then redirect to the extension's chromiumapp.org callback URL.
          const redirectUrl = window.sessionStorage.getItem(
            "timelens_extension_redirect"
          );
          if (!redirectUrl) throw new Error("Missing extension redirect URL.");

          const API_BASE =
            process.env.NEXT_PUBLIC_API_URL || "https://server-liart-xi-18.vercel.app/api";
          const res = await fetch(`${API_BASE}/auth/extension-oauth`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ provider, email, firstName, lastName, avatar }),
          });
          if (!res.ok) {
            const body = await res.json().catch(() => null);
            throw new Error(body?.error ?? `Server error ${res.status}`);
          }
          const { token, user } = await res.json();

          const userParam = encodeURIComponent(JSON.stringify(user));
          window.location.href = `${redirectUrl}?token=${encodeURIComponent(token)}&user=${userParam}`;
          // Navigation is happening; do not remove session storage yet.
          return;
        }

        // Normal web flow: session cookie via /auth/oauth.
        await oauthSignIn({
          provider,
          email,
          firstName,
          lastName,
          avatar,
        });
        // oauthSignIn calls router.push("/dashboard") on success.
      } catch {
        router.replace("/login?oauth=error");
      } finally {
        window.sessionStorage.removeItem("timelens_oauth");
        window.sessionStorage.removeItem("timelens_extension_redirect");
      }
    })();
  }, [loaded, signIn, signUp, oauthSignIn, router, searchParams]);

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
