"use client";

import { useEffect, useState, createContext, useContext } from "react";

type Theme = "light" | "dark";
type StoredTheme = Theme | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getPreferredTheme = (): Theme => {
  if (typeof window === "undefined") {
    return "light";
  }

  const currentTheme = document.documentElement.classList.contains("dark")
    ? "dark"
    : document.documentElement.classList.contains("light")
      ? "light"
      : null;

  if (currentTheme) {
    return currentTheme;
  }

  const savedTheme = localStorage.getItem("theme") as StoredTheme | null;
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getPreferredTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const initialTheme = getPreferredTheme();
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  useEffect(() => {
    if (mounted) {
      applyTheme(theme);
    }
  }, [theme, mounted]);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;

    root.classList.remove("light", "dark");
    root.classList.add(newTheme);
    root.setAttribute("data-theme", newTheme);
    root.style.colorScheme = newTheme;
  };

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    handleSetTheme(newTheme);
  };

  // Prevent hydration mismatch by showing consistent content
  if (!mounted) {
    return <div suppressHydrationWarning>{children}</div>;
  }

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme: handleSetTheme, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
