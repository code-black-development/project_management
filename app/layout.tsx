import type { Metadata } from "next";

import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";

import { QueryProvider } from "@/components/query-provider";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/providers/theme-provider";
import { SessionProviderBoundary } from "@/components/session-provider-boundary";

const inter = Inter({
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-brand",
  weight: ["400", "600", "700"],
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
  title: "fasta.work",
  description: "Project management that moves as fast as you do.",
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
      <body className={cn(inter.className, plusJakartaSans.variable, "antialiased min-h-screen")}>
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
