"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Play, Shield, TrendingUp } from "lucide-react";
import RotatingText from "@/components/reactbits/RotatingText";
import Hyperspeed from "@/components/reactbits/Hyperspeed";

const trustItems = [
  { icon: Shield, label: "Privacy by Design" },
  { icon: Clock, label: "Automatic Tracking" },
  { icon: TrendingUp, label: "Actionable Insights" },
];

const HERO_HYPERSPEED_OPTIONS_DARK = {
  speedUp: 0.9,
  fovSpeedUp: 90,
  carLightsFade: 0.35,
  lightPairsPerRoadWay: 26,
  totalSideLightSticks: 12,
  colors: {
    roadColor: 0x0d1018,
    islandColor: 0x11151f,
    background: 0x0b0e14,
    shoulderLines: 0x222a3a,
    brokenLines: 0x222a3a,
    leftCars: [0x8994c7, 0x7c83d9, 0x6d5df6],
    rightCars: [0x3b82f6, 0x0ea5e9, 0x60a5fa],
    sticks: 0x3b82f6
  }
};

function useDarkMode() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const el = document.documentElement;
    const update = () => setDark(el.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return dark;
}

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

function useReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setShown(true), delay);
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  return [ref, shown] as const;
}

export function Hero() {
  const dark = useDarkMode();
  const reducedMotion = usePrefersReducedMotion();

  const showHyperSpeed = dark && !reducedMotion;

  const [eyebrowRef, eyebrowShown] = useReveal(80);
  const [titleRef, titleShown] = useReveal(160);
  const [subtitleRef, subtitleShown] = useReveal(260);
  const [actionsRef, actionsShown] = useReveal(360);
  const [trustRef, trustShown] = useReveal(460);
  const [visualRef, visualShown] = useReveal(420);

  const [glow, setGlow] = useState<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setGlow({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: true });
    setTilt({ x: (py - 0.5) * -2.2, y: (px - 0.5) * 2.2 });
  };

  const handleLeave = () => {
    setGlow((g) => ({ ...g, active: false }));
    setTilt({ x: 0, y: 0 });
  };

  const revealClass = (shown: boolean) =>
    `transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
      shown ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-10 blur-md"
    }`;

  return (
    <section
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="relative bg-[#FCFCFD] dark:bg-[#0C0C10] overflow-hidden"
    >
      {/* Light theme — soft ambient glows behind the dashboard */}
      <div className="pointer-events-none absolute inset-0 dark:hidden" aria-hidden>
        <div
          className="absolute top-[-10%] right-[-8%] h-[110%] w-[66%] rounded-full opacity-[0.16]"
          style={{ background: "radial-gradient(closest-side, #E3E6F7, transparent 72%)", filter: "blur(48px)" }}
        />
        <div
          className="absolute bottom-[-18%] right-[4%] h-[80%] w-[52%] rounded-full opacity-[0.12]"
          style={{ background: "radial-gradient(closest-side, #DCE7F8, transparent 72%)", filter: "blur(56px)" }}
        />
      </div>

      {/* Dark theme — subtle cool ambient glow behind the dashboard */}
      <div className="pointer-events-none absolute inset-0 hidden dark:block" aria-hidden>
        <div
          className="absolute right-[-6%] top-[-6%] h-[86%] w-[64%] rounded-full opacity-[0.20]"
          style={{ background: "radial-gradient(closest-side, rgba(124,131,217,0.5), transparent 70%)", filter: "blur(72px)" }}
        />
        <div
          className="absolute bottom-[-22%] right-[10%] h-[72%] w-[48%] rounded-full opacity-[0.14]"
          style={{ background: "radial-gradient(closest-side, rgba(37,99,235,0.4), transparent 70%)", filter: "blur(72px)" }}
        />
      </div>

      {/* Hyperspeed — dark desktop only, confined to the right side, low intensity */}
      {showHyperSpeed && (
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-[58%] opacity-[0.45]"
          aria-hidden
          style={{
            filter: "saturate(0.6) brightness(0.85)",
            maskImage: "linear-gradient(to right, transparent 0%, #000 24%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 24%)",
          }}
        >
          <Hyperspeed effectOptions={HERO_HYPERSPEED_OPTIONS_DARK} bloomThreshold={0.35} />
        </div>
      )}

      {/* Cursor glow */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        aria-hidden
        style={{
          opacity: glow.active ? 1 : 0,
          background: `radial-gradient(360px circle at ${glow.x}px ${glow.y}px, ${
            dark ? "rgba(124,131,217,0.14)" : "rgba(109,93,246,0.08)"
          }, transparent 60%)`,
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 sm:px-8 lg:px-10 pt-10 sm:pt-14 lg:pt-16 pb-20 sm:pb-24 lg:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] gap-12 lg:gap-10 items-center w-full">
          {/* LEFT */}
          <div className="mx-auto w-full max-w-[600px] lg:mx-0 lg:max-w-none">
            <div ref={eyebrowRef} className={revealClass(eyebrowShown)}>
              <span className="text-[13px] font-medium uppercase tracking-[0.18em] text-[#667085] dark:text-[#8994C7]">
                Time Intelligence
              </span>
            </div>

            <div ref={titleRef} className={`mt-10 sm:mt-12 ${revealClass(titleShown)}`}>
              <h1 className="font-bold text-left text-[#111318] dark:text-[#F5F7FA] whitespace-nowrap text-[32px] leading-[1.12] tracking-[-0.03em] sm:text-[40px] sm:leading-[1.1] lg:text-[46px] xl:text-[52px]">
                Understand your work.
              </h1>
              <div
                className="font-bold text-left bg-gradient-to-r from-[#8B93A8] to-[#6D5DF6] bg-clip-text text-transparent overflow-hidden whitespace-nowrap text-[32px] leading-[1.12] sm:text-[40px] sm:leading-[1.1] lg:text-[46px] xl:text-[52px]"
                style={{ letterSpacing: "-0.03em", marginBottom: 28 }}
              >
                <RotatingText
                  items={[
                    "Stay in flow.",
                    "Work with clarity.",
                    "Focus deeper.",
                    "Own your attention.",
                  ]}
                  interval={3200}
                />
              </div>
            </div>

            <p
              ref={subtitleRef}
              className={`text-left text-[#5B6475] dark:text-[#8F98AA] mb-9 sm:mb-10 text-[17px] leading-[1.7] sm:text-[18px] lg:text-[19px] ${revealClass(subtitleShown)}`}
              style={{ maxWidth: 560, fontWeight: 400 }}
            >
              Automatic activity tracking that brings clarity and focus to your
              workday.
            </p>

            <div
              ref={actionsRef}
              className={`flex flex-wrap items-center gap-3 ${revealClass(actionsShown)}`}
            >
              <Link
                href="/register"
                className="group inline-flex items-center gap-2.5 bg-[#0F172A] text-white text-[15px] font-semibold transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#1e293b] hover:shadow-[0_12px_30px_rgba(15,23,42,0.22)] hover:-translate-y-0.5 active:scale-[0.98] dark:bg-[#F7F8FA] dark:text-[#111827] dark:hover:bg-[#E5E7EB] dark:hover:shadow-[0_12px_30px_rgba(0,0,0,0.30)]"
                style={{ height: 48, borderRadius: 14, paddingLeft: 22, paddingRight: 20 }}
              >
                Get Started
                <ArrowRight className="w-4 h-4 transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5" />
              </Link>
              <button
                className="group inline-flex items-center gap-2.5 bg-transparent text-[#111318] dark:text-[#F5F7FA] border border-[#D8DAE2] dark:border-[#2A2D35] text-[15px] font-medium transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#F3F4F6] dark:hover:bg-[#1A1D24] hover:border-[#98A2B3] dark:hover:border-[#4B5563] hover:-translate-y-0.5 active:scale-[0.98]"
                style={{ height: 48, borderRadius: 14, paddingLeft: 20, paddingRight: 20 }}
              >
                <Play className="w-4 h-4 transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110" fill="currentColor" />
                Watch Demo
              </button>
            </div>

            <div
              ref={trustRef}
              className={`mt-12 sm:mt-14 flex flex-wrap items-center gap-x-6 gap-y-3 ${revealClass(trustShown)}`}
            >
              {trustItems.map((item, i) => (
                <Fragment key={item.label}>
                  {i > 0 && (
                    <span aria-hidden className="hidden sm:block h-3.5 w-px bg-[#E1E4EA] dark:bg-[#2A2D35]" />
                  )}
                  <div className="flex items-center" style={{ gap: 10 }}>
                    <item.icon className="w-4 h-4 text-[#A9B2C0] dark:text-[#6B7280]" strokeWidth={1.5} />
                    <span className="text-[13px] font-medium text-[#667085] dark:text-[#98A2B3] whitespace-nowrap tracking-[-0.01em]">{item.label}</span>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>

          {/* RIGHT — dashboard product visual */}
          <div className="relative w-full flex justify-center lg:justify-center lg:pt-12">
            <div
              ref={visualRef}
              className={`relative w-full max-w-[760px] ${revealClass(visualShown)}`}
              style={{
                transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transition: "transform 200ms cubic-bezier(0.32,0.72,0,1)",
                transformStyle: "preserve-3d",
                willChange: "transform",
              }}
            >
              <div className="rounded-[24px] bg-white dark:bg-[#141821] p-2 border border-[#E7E8ED] dark:border-[#232A38] shadow-[0_1px_2px_rgba(16,24,40,0.05),0_24px_60px_-24px_rgba(16,24,40,0.22)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_32px_90px_-28px_rgba(124,131,217,0.35)]">
                <div className="overflow-hidden rounded-[16px] border border-[#E7E8ED] dark:border-[#232A38] bg-white dark:bg-[#141821]">
                  <img
                    src="/dashboard.avif"
                    alt="TimeLens dashboard preview"
                    className="relative w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
