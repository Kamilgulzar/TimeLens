"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useClerk, useSignIn, useSignUp } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import BfcacheGuard from "@/components/auth/BfcacheGuard";

/**
 * OAuth callback. Clerk redirects the browser here after the user authenticates
 * with Google or GitHub. This page reads the verified identity from the
 * restored sign-in/sign-up attempt and hands it to our server (/auth/oauth),
 * which creates or finds the user and issues our own session cookie.
 *
 * We deliberately do NOT call signIn.finalize() / signUp.finalize(): our server
 * owns the session, Clerk is only the identity-verification channel.
 */
export default function SSOCallbackPage() {
  const { loaded } = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { oauthSignIn } = useAuth();
  const router = useRouter();
  const hasRun = useRef(false);

  useEffect(() => {
    if (!loaded || hasRun.current) return;
    hasRun.current = true;

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