import { VerifyEmailCard } from "@/components/auth/verify-email-card";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; reason?: string }>;
}) {
  const { email = "", reason } = await searchParams;

  return <VerifyEmailCard email={email} reason={reason} />;
}
