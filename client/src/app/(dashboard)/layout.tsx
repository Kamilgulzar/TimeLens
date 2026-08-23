"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "./dashboard/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Client-side backstop. The proxy already blocks unauthenticated requests
  // at the network edge, so this only fires after the auth check resolves and
  // confirms there is no session (e.g. expired token). It never shows a
  // full-screen loader — the shell stays rendered and the redirect is instant.
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex h-svh w-full flex-col overflow-hidden bg-background lg:flex-row">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}