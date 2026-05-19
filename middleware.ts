import { NextRequest, NextResponse } from "next/server";

// Routes that should always pass through without any middleware logic
const PASSTHROUGH_PREFIXES = [
  "/_next",
  "/api/webhooks",
  "/fonts",
  "/email-templates",
  "/favicon.ico",
];

function isPassthrough(pathname: string) {
  return PASSTHROUGH_PREFIXES.some((p) => pathname.startsWith(p));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";

  if (isPassthrough(pathname)) {
    return NextResponse.next();
  }

  const isAppSubdomain =
    hostname.startsWith("app.") ||
    hostname === "app.localhost" ||
    hostname.startsWith("app.localhost:");

  // On app subdomain, redirect bare / to /workspaces
  // The workspaces page handles auth and picks the right workspace
  if (isAppSubdomain && pathname === "/") {
    return NextResponse.redirect(new URL("/workspaces", request.url));
  }

  // On root domain, redirect app-only paths to the app subdomain
  if (!isAppSubdomain && pathname.startsWith("/workspaces")) {
    const appOrigin =
      process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://app.localhost:3000";
    return NextResponse.redirect(new URL(pathname, appOrigin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
