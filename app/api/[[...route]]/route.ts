import { Hono } from "hono";
import { handle } from "hono/vercel";
import { clerkMiddleware } from "@hono/clerk-auth";

import workspaces from "@/features/workspaces/server/route";
import members from "@/features/members/server/route";
import projects from "@/features/projects/server/route";

//export const runtime = "edge";

const app = new Hono().basePath("/api");
app.use("*", clerkMiddleware());

const routes = app
  .route("/workspace", workspaces)
  .route("/members", members)
  .route("/projects", projects);

export const POST = handle(app);
export const GET = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);

export type AppType = typeof routes;
