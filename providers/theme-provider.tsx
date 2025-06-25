"use client";

import { useEffect, useState } from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<string | null>(null);

  useEffect(() => {
    // Get theme from localStorage or system preference
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    setTheme(savedTheme ?? (prefersDark ? "dark" : "light"));
  }, []);

  // Prevent rendering until theme is set (avoiding hydration mismatch)
  if (!theme) return null;

  return <div className={theme}>{children}</div>;
}
