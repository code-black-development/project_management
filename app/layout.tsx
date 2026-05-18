import type { Metadata } from "next";

import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

import { QueryProvider } from "@/components/query-provider";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/providers/theme-provider";
import { SessionProviderBoundary } from "@/components/session-provider-boundary";

const inter = Inter({
  subsets: ["latin"],
});
export const dynamic = "force-dynamic";

const themeInitScript = `
(() => {
  try {
    const storedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = storedTheme === "light" || storedTheme === "dark"
      ? storedTheme
      : prefersDark
        ? "dark"
        : "light";
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  } catch {
  }
})();
`;

export const metadata: Metadata = {
  title: "CodeFlow Pro",
  description: "Code management by Codeblack Digtal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body className={cn(inter.className, "antialiased min-h-screen")}>
        <ThemeProvider>
          <Toaster />
          <SessionProviderBoundary>
            <QueryProvider>{children}</QueryProvider>
          </SessionProviderBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
