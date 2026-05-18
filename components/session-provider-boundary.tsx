"use client";

import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";

const authPaths = [
  "/sign-in",
  "/sign-up",
  "/sign-out",
  "/forgot-password",
  "/reset-password",
];

export function SessionProviderBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = authPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isAuthPage) {
    return children;
  }

  return (
    <SessionProvider refetchOnWindowFocus={false}>{children}</SessionProvider>
  );
}
