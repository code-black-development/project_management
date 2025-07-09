"use client";

import { useEffect, useState, createContext, useContext } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Get theme from localStorage or system preference
    const savedTheme = localStorage.getItem("theme") as Theme;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    setTheme(initialTheme);
    
    // Apply theme to document root immediately
    applyTheme(initialTheme);
  }, []);

  // Also apply theme whenever it changes
  useEffect(() => {
    if (mounted) {
      applyTheme(theme);
    }
  }, [theme, mounted]);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove("light", "dark");
    
    // Add new theme class
    root.classList.add(newTheme);
    
    // Also set data attribute for CSS targeting
    root.setAttribute("data-theme", newTheme);
    
    // Force repaint in Firefox
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
    return (
      <div suppressHydrationWarning>
        {children}
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, toggleTheme }}>
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
