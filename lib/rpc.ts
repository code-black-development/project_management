import { hc } from "hono/client";
import { AppType } from "@/app/api/[[...route]]/route";

// Function to get the API base URL
function getApiBaseUrl(): string {
  // Check if we have a custom API URL set
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Check if we're on the client side
  if (typeof window !== "undefined") {
    // Client-side: use the current origin
    return `${window.location.origin}`;
  }

  // Server-side: construct URL based on environment
  if (process.env.VERCEL_URL) {
    // Vercel deployment
    return `https://${process.env.VERCEL_URL}`;
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    // Custom app URL
    return `${process.env.NEXT_PUBLIC_APP_URL}`;
  }

  // Development fallback
  return "http://localhost:3000";
}

export const client = hc<AppType>(getApiBaseUrl());
