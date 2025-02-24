import type { Metadata } from "next";

import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

//import { SessionProvider } from "@hono/auth-js/react";
import { QueryProvider } from "@/components/query-provider";
import { NuqsAdapter } from "nuqs/adapters/next/app";
//import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "antialiased min-h-screen")}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                 const savedTheme = localStorage.getItem("theme");
                 if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
                   document.documentElement.classList.add("dark");
                 }
              })();
  `,
          }}
        />
        <Toaster />
        <NuqsAdapter>
          <QueryProvider>{children}</QueryProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
