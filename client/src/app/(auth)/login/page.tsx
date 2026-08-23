import { AuthCard } from "@/components/auth/auth-card";

interface LoginPageProps {
  searchParams: Promise<{ reset?: string; verified?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { reset, verified } = await searchParams;
  return (
    <AuthCard
      initialMode="login"
      resetSuccess={reset === "success"}
      verifiedSuccess={verified === "success"}
    />
  );
}
