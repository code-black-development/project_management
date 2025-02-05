import { Hono } from "hono";
import { handle } from "hono/vercel";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";

import workspaces from "@/features/workspaces/server/route";

//export const runtime = "edge";

const app = new Hono().basePath("/api");
app.use("*", clerkMiddleware());

const routes = app.route("/workspace", workspaces);

export const POST = handle(app);
export const GET = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);

export type AppType = typeof routes;
