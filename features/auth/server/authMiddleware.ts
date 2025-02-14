import { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { getAuth } from "@hono/clerk-auth";

// Extend Hono's ContextVariableMap to include userId
declare module "hono" {
  interface ContextVariableMap {
    userId: string;
  }
}

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    throw new HTTPException(401, {
      message: "Unauthorized: User not logged in",
    });
  }

  // Store userId in context for use in route handlers
  c.set("userId", auth.userId);

  await next();
};
