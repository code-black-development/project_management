import type { Metadata } from "next";

import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

import { QueryProvider } from "@/components/query-provider";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/providers/theme-provider";

const inter = Inter({
  subsets: ["latin"],
});
export const dynamic = "force-dynamic";

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
    <html lang="en">
      <body className={cn(inter.className, "antialiased min-h-screen")}>
        <ThemeProvider>
          <Toaster />
          <NuqsAdapter>
            <SessionProvider>
              <QueryProvider>{children}</QueryProvider>
            </SessionProvider>
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  );
}
