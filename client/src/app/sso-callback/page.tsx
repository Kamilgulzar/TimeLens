"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useClerk, useSignIn, useSignUp } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import BfcacheGuard from "@/components/auth/BfcacheGuard";

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function readMarker(key: string): string | null {
  const urlVal = new URLSearchParams(window.location.search).get(key);
  if (urlVal) return urlVal;
  const ssVal = window.sessionStorage.getItem(key);
  if (ssVal) return ssVal;
  return getCookie(key);
}

function SSOCallbackInner() {
  const { loaded } = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { oauthSignIn } = useAuth();
  const router = useRouter();
  const hasRun = useRef(false);

  useEffect(() => {
    if (!loaded || hasRun.current) return;
    hasRun.current = true;

    const source = readMarker("timelens_source");
    const isExtension =
      typeof window !== "undefined" &&
      (source === "extension" || source === "desktop");

    (async () => {
      try {
        const provider = readMarker("timelens_oauth") as "google" | "github" | null;

        if (!provider) throw new Error("Missing OAuth provider.");

        let email: string | null = null;
        let firstName: string | undefined;
        let lastName: string | undefined;
        let avatar: string | undefined;

        const MAX_ATTEMPTS = 40;
        for (let i = 0; i < MAX_ATTEMPTS; i++) {
          if (signIn.status === "complete" && signIn.identifier) {
            email = signIn.identifier;
            firstName = signIn.userData?.firstName;
            lastName = signIn.userData?.lastName;
            avatar = signIn.userData?.imageUrl;
            break;
          }

          if (!email && signIn.isTransferable) {
            const res = await signUp.create({ transfer: true });
            if (res.error) throw res.error;
            if (signUp.emailAddress) {
              email = signUp.emailAddress;
              firstName = firstName ?? signUp.firstName ?? undefined;
              lastName = lastName ?? signUp.lastName ?? undefined;
            }
            break;
          }

          await new Promise((r) => setTimeout(r, 200));
        }

        if (!email && signIn.status === "complete" && signIn.identifier) {
          email = signIn.identifier;
          firstName = signIn.userData?.firstName;
          lastName = signIn.userData?.lastName;
          avatar = signIn.userData?.imageUrl;
        }

        if (!email) throw new Error("OAuth flow did not produce an email.");

        if (isExtension) {
          const redirectUrl = readMarker("timelens_redirect");
          if (!redirectUrl) throw new Error("Missing redirect URL.");

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
          return;
        }

        await oauthSignIn({
          provider,
          email,
          firstName,
          lastName,
          avatar,
        });
      } catch {
        if (isExtension) {
          document.title = "OAuth Error";
          document.body.innerHTML =
            '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#ef4444"><p>OAuth failed. Close this window and try again.</p></div>';
          return;
        }
        router.replace("/login?oauth=error");
      } finally {
        window.sessionStorage.removeItem("timelens_oauth");
        window.sessionStorage.removeItem("timelens_extension_redirect");
        window.sessionStorage.removeItem("timelens_source");
        document.cookie = "timelens_oauth=;path=/;max-age=0";
        document.cookie = "timelens_extension_redirect=;path=/;max-age=0";
        document.cookie = "timelens_source=;path=/;max-age=0";
      }
    })();
  }, [loaded, signIn, signUp, oauthSignIn, router]);

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
