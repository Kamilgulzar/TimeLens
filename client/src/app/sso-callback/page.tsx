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
  const match = document.cookie.match(
    new RegExp("(^| )" + key + "=([^;]+)")
  );
  return match ? decodeURIComponent(match[2]) : null;
}

function SSOCallbackInner() {
  const clerk = useClerk();
  const { session } = useSession();
  const { oauthSignIn } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [deepLinkUrl, setDeepLinkUrl] = useState<string | null>(null);
  const hasRun = useRef(false);
  const sessionBootstrapped = useRef(false);

  // ── Phase 1: If created_session_id is in the URL, explicitly set it ──
  useEffect(() => {
    if (!clerk.loaded || sessionBootstrapped.current) return;

    const sessionId = new URLSearchParams(window.location.search).get(
      "created_session_id"
    );
    if (!sessionId) {
      sessionBootstrapped.current = true;
      return;
    }

    sessionBootstrapped.current = true;
    console.log("[OAuth] Bootstrapping session from created_session_id");

    clerk
      .setActive({ session: sessionId })
      .then(() => {
        console.log("[OAuth] Session activated");
      })
      .catch((err) => {
        console.error("[OAuth] setActive failed:", err);
        setError("Failed to establish session. Please try again.");
      });
  }, [clerk]);

  // ── Phase 2: Once session is available, call backend + redirect ──
  useEffect(() => {
    if (!clerk.loaded || hasRun.current || !session) return;
    hasRun.current = true;

    const source = readMarker("timelens_source");
    const isExtension = source === "extension" || source === "desktop";
    console.log("[OAuth] Phase 2 running, source:", source, "isExtension:", isExtension);

    (async () => {
      try {
        const provider = readMarker("timelens_oauth") as
          | "google"
          | "github"
          | null;
        console.log("[OAuth] provider:", provider);
        if (!provider) throw new Error("Missing OAuth provider.");

        const email =
          session.user.primaryEmailAddress?.emailAddress ||
          session.user.emailAddresses?.[0]?.emailAddress;
        console.log("[OAuth] email:", email);
        if (!email) throw new Error("No email found in session.");

        const firstName = session.user.firstName ?? undefined;
        const lastName = session.user.lastName ?? undefined;
        const avatar = session.user.imageUrl ?? undefined;

        if (isExtension) {
          const redirectUrl = readMarker("timelens_redirect");
          console.log("[OAuth] redirectUrl:", redirectUrl);
          if (!redirectUrl) throw new Error("Missing redirect URL.");

          const API_BASE =
            process.env.NEXT_PUBLIC_API_URL ||
            "https://server-liart-xi-18.vercel.app/api";

          console.log("[OAuth] Calling extension-oauth at", `${API_BASE}/auth/extension-oauth`);
          const res = await fetch(`${API_BASE}/auth/extension-oauth`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              provider,
              email,
              firstName,
              lastName,
              avatar,
            }),
          });

          console.log("[OAuth] Response status:", res.status);

          if (!res.ok) {
            const body = await res.json().catch(() => null);
            throw new Error(body?.error ?? `Server error ${res.status}`);
          }

          const { token, user } = await res.json();
          console.log("[OAuth] JWT received, building redirect URL");

          const userParam = encodeURIComponent(JSON.stringify(user));
          const url = `${redirectUrl}?token=${encodeURIComponent(token)}&user=${userParam}`;
          setDeepLinkUrl(url);
          console.log("[OAuth] Attempting redirect to:", url.substring(0, 60) + "...");
          await clerk.signOut();
          console.log("[OAuth] Signed out of Clerk, redirecting to desktop");
          window.location.href = url;
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
        console.error("[OAuth] Error:", msg);
        if (isExtension) {
          setError(msg);
          return;
        }
        router.replace("/login?oauth=error");
      } finally {
        window.sessionStorage.removeItem("timelens_oauth");
        window.sessionStorage.removeItem("timelens_extension_redirect");
        window.sessionStorage.removeItem("timelens_redirect");
        window.sessionStorage.removeItem("timelens_source");
        document.cookie = "timelens_source=;path=/;max-age=0";
        document.cookie = "timelens_oauth=;path=/;max-age=0";
        document.cookie = "timelens_redirect=;path=/;max-age=0";
      }
    })();
  }, [clerk, session, oauthSignIn, router]);

  // ── Error state ──
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFC] dark:bg-[#0C0C10]">
        <div className="flex flex-col items-center gap-4 max-w-md text-center px-6">
          <p className="text-[14px] text-[#EF4444]">{error}</p>
          {deepLinkUrl && (
            <a
              href={deepLinkUrl}
              className="inline-flex h-10 items-center justify-center rounded-[10px] bg-[#6366F1] px-5 text-[14px] font-medium text-white transition-colors hover:bg-[#4f46e5]"
            >
              Open TimeLens
            </a>
          )}
          <p className="text-[12px] text-[#98A2B3]">
            Close this window and try again from the desktop app.
          </p>
        </div>
      </div>
    );
  }

  // ── Loading state ──
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFC] dark:bg-[#0C0C10]">
      <BfcacheGuard />
      <div className="flex flex-col items-center gap-4">
        <Loader2
          className="h-7 w-7 animate-spin text-[#6366F1]"
          strokeWidth={1.5}
        />
        <p className="text-[14px] text-[#667085] dark:text-[#98A2B3]">
          {session
            ? "Authentication successful. Returning to TimeLens…"
            : "Signing you into TimeLens…"}
        </p>
        {deepLinkUrl && (
          <a
            href={deepLinkUrl}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-[10px] bg-[#6366F1] px-5 text-[14px] font-medium text-white transition-colors hover:bg-[#4f46e5]"
          >
            Open TimeLens
          </a>
        )}
      </div>
    </div>
  );
}

export default function SSOCallbackPage() {
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
      <SSOCallbackInner />
    </Suspense>
  );
}
