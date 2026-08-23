"use client";

import { useClerk, useSignIn, useSignUp } from "@clerk/nextjs";

/**
 * Thin wrapper around Clerk's email_code one-time-password flows.
 *
 * Both OTP flows use the sign-up path (`signUp.verifications.*`) because our
 * users are server-owned (email + password in our own DB, never finalized as
 * Clerk users). Clerk is used purely as the code delivery + verification
 * channel:
 *
 * - sendVerificationCode: sends a code to prove ownership of the email after
 *   the user registers on our server.
 * - verifyVerificationCode: confirms the code sent during sign-up.
 * - sendResetCode: sends a code for the forgot-password flow.
 * - verifyResetCode: confirms the reset code and proceeds to password reset.
 * - startOAuth: kicks off a Google/GitHub provider flow via Clerk; the browser
 *   is redirected to /sso-callback where the verified identity is handed to
 *   our server to create/find the user and issue our own session cookie.
 *
 * Clerk v7 methods return `{ error }` instead of throwing. Each method here
 * rethrows that error so the callers' try/catch + clerkError() contract is
 * preserved.
 */
export function useClerkOtp() {
  const { loaded } = useClerk();
  const { signUp } = useSignUp();
  const { signIn } = useSignIn();

  const isLoaded = loaded && !!signUp && !!signIn;

  function clerkError(error: unknown): string {
    const clerkErr = error as
      | { longMessage?: string; message?: string; code?: string }
      | null;
    if (clerkErr?.longMessage) return clerkErr.longMessage;
    if (clerkErr?.message) return clerkErr.message;
    return "Something went wrong. Please try again.";
  }

  /** Starts a fresh sign-up attempt for the email and sends the code. */
  async function sendVerificationCode(email: string): Promise<void> {
    if (!signUp) throw new Error("Clerk sign-up is not ready.");

    const created = await signUp.create({ emailAddress: email });
    if (created.error) throw created.error;

    const sent = await signUp.verifications.sendEmailCode();
    if (sent.error) throw sent.error;
  }

  /** Verifies the code entered on the verify-email screen. */
  async function verifyVerificationCode(code: string): Promise<void> {
    if (!signUp) throw new Error("Clerk sign-up is not ready.");

    const verified = await signUp.verifications.verifyEmailCode({ code });
    if (verified.error) throw verified.error;

    // No Clerk session to activate; our own login (email + password) owns the
    // session. We only need proof that the code was correct.
  }

  /** Re-sends the verification code (only valid while the sign-up is pending). */
  async function resendVerificationCode(): Promise<void> {
    if (!signUp) throw new Error("Clerk sign-up is not ready.");

    const sent = await signUp.verifications.sendEmailCode();
    if (sent.error) throw sent.error;
  }

  /** Sends the reset code for the forgot-password flow. */
  async function sendResetCode(email: string): Promise<void> {
    if (!signUp) throw new Error("Clerk sign-up is not ready.");

    const created = await signUp.create({ emailAddress: email });
    if (created.error) throw created.error;

    const sent = await signUp.verifications.sendEmailCode();
    if (sent.error) throw sent.error;
  }

  /** Verifies the reset code and lets the user choose a new password on our server. */
  async function verifyResetCode(code: string): Promise<void> {
    if (!signUp) throw new Error("Clerk sign-up is not ready.");

    const verified = await signUp.verifications.verifyEmailCode({ code });
    if (verified.error) throw verified.error;
  }

  /** Re-sends the reset code (only valid while the sign-in is pending). */
  async function resendResetCode(): Promise<void> {
    if (!signUp) throw new Error("Clerk sign-up is not ready.");

    const sent = await signUp.verifications.sendEmailCode();
    if (sent.error) throw sent.error;
  }

  /**
 * Starts the Google/GitHub OAuth flow. Clerk redirects to /sso-callback.
 *
 * We create the sign-in attempt ourselves and navigate with raw
 * `window.location.href` instead of relying on Clerk's `signIn.sso()`, whose
 * built-in navigation can silently hang (spinner forever, no redirect) when a
 * stale attempt is left in the browser's Clerk client. The explicit create +
 * direct navigation is deterministic across page loads and server restarts.
 */
  async function startOAuth(
    strategy: "oauth_google" | "oauth_github"
  ): Promise<void> {
    if (!signIn) throw new Error("Clerk sign-in is not ready.");

    const res = await signIn.create({
      strategy,
      redirectUrl: "/sso-callback",
      actionCompleteRedirectUrl: "/sso-callback",
    });
    if (res.error) throw res.error;

    const url = signIn.firstFactorVerification.externalVerificationRedirectURL;
    if (!url) throw new Error("Could not start OAuth: no redirect URL returned.");
    window.location.href = url.toString();
  }

  return {
    isLoaded,
    clerkError,
    sendVerificationCode,
    verifyVerificationCode,
    resendVerificationCode,
    sendResetCode,
    verifyResetCode,
    resendResetCode,
    startOAuth,
  };
}
