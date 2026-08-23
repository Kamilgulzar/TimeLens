"use client";

import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggle = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#667085] transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#98A2B3] hover:text-[#111827] dark:border-[#2A2D35] dark:bg-[#1A1D24] dark:text-[#98A2B3] dark:hover:border-[#6B7280] dark:hover:text-[#F7F8FA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366F1] outline-none motion-reduce:transition-none"
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
