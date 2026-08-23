"use client";

import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "timelens-theme";

function readTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    // Sync with the theme that was applied by the inline bootstrap script so
    // the selected control matches what's actually visible, even if the
    // localStorage value changed on another tab.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(readTheme());
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Ignore storage failures (private mode etc.).
    }
    applyTheme(next);
  }, []);

  return { theme, setTheme };
}