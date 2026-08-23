"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

import Hyperspeed from "@/components/reactbits/Hyperspeed";
import BfcacheGuard from "@/components/auth/BfcacheGuard";
import { Logo } from "@/components/logo";

const AUTH_HYPERSPEED_OPTIONS = {
  speedUp: 0.7,
  fovSpeedUp: 80,
  carLightsFade: 0.4,
  lightPairsPerRoadWay: 22,
  totalSideLightSticks: 10,
  colors: {
    roadColor: 0x0e1119,
    islandColor: 0x12161f,
    background: 0x0b0d13,
    shoulderLines: 0x232a3a,
    brokenLines: 0x232a3a,
    leftCars: [0x8892c9, 0x7c83d9, 0x6d5df6],
    rightCars: [0x3b82f6, 0x60a5fa, 0x8b93a8],
    sticks: 0x3b82f6
  }
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduced;
}

function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return desktop;
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const reducedMotion = usePrefersReducedMotion();

  const showFlow = isDesktop && !reducedMotion;

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  return (
    <div className="relative min-h-[100dvh] bg-[#F4F5F8] dark:bg-[#080A0F] overflow-hidden">
      <BfcacheGuard />

      {/* Ambient page glow */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute -top-40 left-1/2 h-[520px] w-[860px] -translate-x-1/2 rounded-full opacity-[0.11] dark:opacity-[0.14]"
          style={{ background: "radial-gradient(closest-side, #B9BFF5, transparent 70%)", filter: "blur(60px)" }}
        />
        <div
          className="absolute bottom-[-10%] right-[-8%] h-[420px] w-[560px] rounded-full opacity-[0.08] dark:opacity-[0.12]"
          style={{ background: "radial-gradient(closest-side, #8FB1F0, transparent 70%)", filter: "blur(70px)" }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[1200px] flex-col items-center justify-center p-4 sm:p-5 lg:p-7">
        {/* Mobile logo */}
        <Link href="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
          <Logo className="h-9 w-9" />
          <span className="text-[16px] font-semibold text-[#0B0B0F] dark:text-[#F5F5F7] tracking-[-0.01em]">TimeLens</span>
        </Link>

        {/* Split-screen container */}
        <div className="grid w-full grid-cols-1 overflow-hidden rounded-[28px] border border-[#E7E8ED] bg-[#FCFCFD] dark:border-[#161C26] dark:bg-[#0D1017] shadow-[0_24px_80px_-40px_rgba(16,24,40,0.30)] dark:shadow-[0_28px_90px_-30px_rgba(0,0,0,0.85)] lg:grid-cols-[1.05fr_1fr]">
          {/* LEFT — brand panel */}
          <aside className="relative hidden lg:flex min-h-[620px] flex-col overflow-hidden bg-[#0B0D13] p-10 xl:p-14">
            {/* ambient orbs */}
            <div className="pointer-events-none absolute -right-28 -top-28 h-[380px] w-[380px] rounded-full bg-[#6D5DF6]/30 blur-[100px]" />
            <div className="pointer-events-none absolute -left-28 bottom-[-10%] h-[340px] w-[340px] rounded-full bg-[#3B82F6]/20 blur-[100px]" />

            {/* subtle flowing lines */}
            {showFlow && (
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.15]"
                aria-hidden
                style={{
                  filter: "saturate(0.55) brightness(0.9)",
                  maskImage: "linear-gradient(to right, rgba(0,0,0,0.25) 0%, #000 55%)",
                  WebkitMaskImage: "linear-gradient(to right, rgba(0,0,0,0.25) 0%, #000 55%)",
                }}
              >
                <Hyperspeed effectOptions={AUTH_HYPERSPEED_OPTIONS} bloomThreshold={0.3} />
              </div>
            )}

            {/* logo */}
            <div className="relative z-10 flex items-center gap-2.5">
              <Logo variant="onDark" className="h-9 w-9" />
              <span className="text-[16px] font-semibold text-white tracking-[-0.01em]">TimeLens</span>
            </div>

            {/* product statement + mini viz */}
            <div className="relative z-10 mt-14">
              <p className="text-[28px] xl:text-[32px] font-semibold leading-[1.25] tracking-[-0.02em] text-white max-w-[360px]">
                Understand how you
                <br />
                spend your time.
              </p>
              <p className="mt-4 max-w-[350px] text-[14.5px] leading-[1.7] text-[#98A2B3]">
                Automatic activity tracking turns your workday
                <br />
                into clear, actionable insight toward deeper focus.
              </p>

              <div className="mt-8 max-w-[340px] rounded-2xl border border-white/10 bg-white/[0.05] px-5 pt-5 pb-4">
                <div className="min-w-0">
                  <p className="text-[12.5px] font-medium text-[#8B93A8]">Today&apos;s Deep Work</p>
                  <p className="mt-0.5 text-[16px] font-semibold tracking-[-0.01em] text-white">
                    3h 14m <span className="text-[12.5px] font-medium text-[#4ADE80]">↑ 18% vs yesterday</span>
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* RIGHT — auth panel */}
          <div className="relative flex w-full items-center justify-center bg-[transparent] px-6 py-12 sm:px-10 lg:px-12 xl:px-16">
            <div className="w-full max-w-[420px]">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}