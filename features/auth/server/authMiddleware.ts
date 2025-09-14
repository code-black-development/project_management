import { Hono } from "hono";
import { auth } from "@/auth";
import { Context } from "hono";

declare module "hono" {
  interface ContextVariableMap {
    userId: string;
  }
}

export const authMiddleware = async (c: Context, next: () => Promise<void>) => {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    // Set the userId in context
    c.set("userId", userId);

    await next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return c.json({ message: "Authentication error" }, 500);
  }
};
