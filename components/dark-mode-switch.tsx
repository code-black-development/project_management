"use client";

import { Switch } from "@/components/ui/switch";
import { useState, useLayoutEffect } from "react";

type theme = "light" | "dark" | "system";

const DarkModeSwitch = () => {
  const [activeTheme, setActiveTheme] = useState<theme>("system");

  useLayoutEffect(() => {
    const savedTheme = localStorage.getItem("theme") as theme;
    if (savedTheme === "system" || !savedTheme) {
      setActiveTheme("system");
    } else {
      setActiveTheme(savedTheme);
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      if (!savedTheme || savedTheme === "system") {
        applySystemTheme();
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, []);

  const applyTheme = (theme: string) => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleThemeChange = (newTheme: theme) => {
    setActiveTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "system") {
      applySystemTheme();
    } else {
      applyTheme(newTheme);
    }
  };

  const applySystemTheme = () => {
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    if (systemPrefersDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Switch
        checked={activeTheme === "dark"}
        onCheckedChange={() =>
          handleThemeChange(activeTheme === "dark" ? "light" : "dark")
        }
      />
      <span>Dark Mode</span>
    </div>
  );
};

export default DarkModeSwitch;
