"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, LayoutDashboard, LogOut, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/logo";
import { useAuth } from "@/lib/auth";

const navLinks = [
  { label: "Product", hasDropdown: true },
  { label: "Solutions", hasDropdown: true },
  { label: "Resources", hasDropdown: true },
  { label: "Pricing", hasDropdown: false },
  { label: "Changelog", hasDropdown: false },
];

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";
const DUR = "duration-200";
const MR_FADE = "motion-reduce:transition-none";
const MR_SLIDE =
  "motion-reduce:transition-none group-hover:motion-reduce:translate-none group-focus-visible:motion-reduce:translate-none";

function getInitials(user: { firstName: string; lastName: string }): string {
  const first = user.firstName?.trim().charAt(0) || "";
  const last = user.lastName?.trim().charAt(0) || "";
  return `${first}${last}`.toUpperCase() || "U";
}

export function Navbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const closeProfile = () => setProfileOpen(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full px-4 sm:px-6 pt-3 pb-2 animate-[fadeIn_0.6s_ease-out_both]">
      <div className="mx-auto w-full max-w-[1400px]">
        <nav className="relative flex h-11 items-center justify-between gap-3 rounded-xl border border-[#ECECEC]/80 bg-[#FCFCFD]/85 px-3.5 shadow-[0_8px_28px_rgba(16,24,40,0.06)] backdrop-blur-xl dark:border-[#2A2D35]/60 dark:bg-[#0C0C10]/85 dark:shadow-[0_8px_28px_rgba(0,0,0,0.45)]">
          <div className="flex flex-1 items-center min-w-0">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Logo className="w-7 h-7" />
              <span className="text-[15px] font-semibold text-[#0B0B0F] dark:text-[#F5F5F7] tracking-[-0.01em]">TimeLens</span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <button
                key={link.label}
                className={`group flex items-center gap-1 rounded-full px-3 py-1.5 text-[13.5px] font-medium text-[#667085] dark:text-[#98A2B3] transition-colors ${DUR} ${EASE} hover:text-[#111318] hover:bg-[#F1F2F4] dark:hover:text-[#F7F8FA] dark:hover:bg-[#1A1D24] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366F1] outline-none ${MR_FADE}`}
              >
                {link.label}
                {link.hasDropdown && (
                  <ChevronDown className={`w-3.5 h-3.5 opacity-50 transition-transform ${DUR} ${EASE} group-hover:translate-y-px ${MR_SLIDE}`} />
                )}
              </button>
            ))}
          </nav>

          <div className="flex flex-1 items-center justify-end gap-2 min-w-0">
            <ThemeToggle />

            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((open) => !open)}
                  className={`group flex items-center gap-1.5 rounded-full p-1 pr-1.5 transition-colors ${DUR} ${EASE} hover:bg-[#F1F2F4] dark:hover:bg-[#1A1D24] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366F1] outline-none ${MR_FADE}`}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={`${user.firstName} avatar`}
                      className={`w-8 h-8 rounded-full object-cover ring-1 ring-black/5 dark:ring-white/10 transition-all ${DUR} ${EASE} group-hover:scale-[1.02] group-focus-visible:scale-[1.02] group-hover:ring-[#6366F1]/50 group-focus-visible:ring-[#6366F1]/50 ${MR_FADE} group-hover:motion-reduce:scale-100 group-focus-visible:motion-reduce:scale-100`}
                    />
                  ) : (
                    <div className={`w-8 h-8 rounded-full bg-[#6366F1] flex items-center justify-center text-[12px] font-semibold text-white transition-all ${DUR} ${EASE} group-hover:scale-[1.02] group-focus-visible:scale-[1.02] group-hover:ring-2 group-hover:ring-[#6366F1]/40 group-focus-visible:ring-2 group-focus-visible:ring-[#6366F1]/40 ${MR_FADE} group-hover:motion-reduce:scale-100 group-focus-visible:motion-reduce:scale-100`}>
                      {getInitials(user)}
                    </div>
                  )}
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#667085] dark:text-[#98A2B3] transition-transform duration-150 ${
                      profileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-3 w-60 rounded-2xl border border-[#ECECEC]/80 bg-[#FCFCFD]/95 shadow-[0_8px_28px_rgba(16,24,40,0.1)] backdrop-blur-xl dark:border-[#2A2D35]/60 dark:bg-[#0C0C10]/95 dark:shadow-[0_8px_28px_rgba(0,0,0,0.5)] p-1.5">
                    <div className="px-3.5 py-2.5">
                      <p className="text-[13px] font-semibold text-[#111318] dark:text-[#F7F8FA] truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-[12px] text-[#667085] dark:text-[#98A2B3] truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>
                    <div className="h-px bg-[#ECECEC] dark:bg-[#2A2D35]/60 mx-1.5" />
                    <Link
                      href="/dashboard"
                      onClick={closeProfile}
                      className={`mt-1.5 flex items-center gap-2.5 rounded-lg px-3.5 py-2 text-[13.5px] font-medium text-[#111318] dark:text-[#F7F8FA] transition-colors ${DUR} ${EASE} hover:bg-[#F1F2F4] dark:hover:bg-[#1A1D24] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366F1] outline-none motion-reduce:transition-none`}
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#667085] dark:text-[#98A2B3]" strokeWidth={1.75} />
                      View Dashboard
                    </Link>
                    <Link
                      href="/dashboard/profile"
                      onClick={closeProfile}
                      className={`flex items-center gap-2.5 rounded-lg px-3.5 py-2 text-[13.5px] font-medium text-[#111318] dark:text-[#F7F8FA] transition-colors ${DUR} ${EASE} hover:bg-[#F1F2F4] dark:hover:bg-[#1A1D24] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366F1] outline-none motion-reduce:transition-none`}
                    >
                      <Settings className="w-4 h-4 text-[#667085] dark:text-[#98A2B3]" strokeWidth={1.75} />
                      Profile
                    </Link>
                    <button
                      onClick={logout}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2 text-[13.5px] font-medium text-red-600 dark:text-red-400 transition-colors ${DUR} ${EASE} hover:bg-red-50 dark:hover:bg-red-500/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 outline-none motion-reduce:transition-none`}
                    >
                      <LogOut className="w-4 h-4" strokeWidth={1.75} />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`group hidden sm:inline-flex items-center px-2 py-1.5 text-[13.5px] font-medium text-[#667085] dark:text-[#98A2B3] transition-colors ${DUR} ${EASE} hover:text-[#111318] dark:hover:text-[#F7F8FA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366F1] outline-none ${MR_FADE}`}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className={`group relative hidden sm:inline-flex items-center rounded-full h-8 px-4 text-[13px] font-medium text-white bg-[#0F172A] hover:bg-[#1e293b] shadow-[0_1px_2px_rgba(15,23,42,0.08)] dark:bg-[#F7F8FA] dark:text-[#111827] dark:hover:bg-[#E5E7EB] dark:shadow-none transition-colors ${DUR} ${EASE} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366F1] outline-none ${MR_FADE}`}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            className={`lg:hidden -ml-1 p-1.5 rounded-lg hover:bg-[#F1F2F4] dark:hover:bg-[#1A1D24] transition-colors ${DUR} ${EASE} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366F1] outline-none ${MR_FADE}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111318" className="dark:stroke-[#F7F8FA]" strokeWidth="2" strokeLinecap="round">
              {mobileOpen ? (
                <>
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </>
              ) : (
                <>
                  <path d="M4 8h16" />
                  <path d="M4 16h16" />
                </>
              )}
            </svg>
          </button>
        </nav>

        {mobileOpen && (
          <div className="lg:hidden mt-2 rounded-2xl border border-[#ECECEC]/80 bg-[#FCFCFD]/95 shadow-[0_8px_28px_rgba(16,24,40,0.1)] backdrop-blur-xl dark:border-[#2A2D35]/60 dark:bg-[#0C0C10]/95 dark:shadow-[0_8px_28px_rgba(0,0,0,0.5)] px-3 py-3">
            {navLinks.map((link) => (
              <button
                key={link.label}
                className={`block w-full text-left rounded-lg px-3.5 py-2.5 text-[14px] font-medium text-[#667085] dark:text-[#98A2B3] transition-colors ${DUR} ${EASE} hover:text-[#111318] hover:bg-[#F1F2F4] dark:hover:text-[#F7F8FA] dark:hover:bg-[#1A1D24] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366F1] outline-none ${MR_FADE}`}
              >
                {link.label}
              </button>
            ))}
            <div className="h-px bg-[#ECECEC] dark:bg-[#2A2D35]/60 mx-1.5 my-2" />
            <div className="space-y-1">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-[14px] font-medium text-[#111318] dark:text-[#F7F8FA] transition-colors ${DUR} ${EASE} hover:bg-[#F1F2F4] dark:hover:bg-[#1A1D24] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366F1] outline-none motion-reduce:transition-none`}
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#667085] dark:text-[#98A2B3]" strokeWidth={1.75} />
                    View Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-[14px] font-medium text-red-600 dark:text-red-400 transition-colors ${DUR} ${EASE} hover:bg-red-50 dark:hover:bg-red-500/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 outline-none motion-reduce:transition-none`}
                  >
                    <LogOut className="w-4 h-4" strokeWidth={1.75} />
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className={`group flex items-center text-[14px] font-medium text-[#667085] dark:text-[#98A2B3] py-2.5 px-3.5 rounded-lg transition-colors ${DUR} ${EASE} hover:text-[#111318] hover:bg-[#F1F2F4] dark:hover:text-[#F7F8FA] dark:hover:bg-[#1A1D24] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366F1] outline-none ${MR_FADE}`}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className={`group mt-1 flex w-full items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-semibold text-white bg-[#0F172A] hover:bg-[#1e293b] dark:bg-[#F7F8FA] dark:text-[#111827] dark:hover:bg-[#E5E7EB] transition-colors ${DUR} ${EASE} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366F1] outline-none ${MR_FADE}`}
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}