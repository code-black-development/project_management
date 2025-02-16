import { Hono } from "hono";
import { handle } from "hono/vercel";
//import { authHandler, initAuthConfig, verifyAuth } from "@hono/auth-js";
//import Credentials from "next-auth/providers/credentials";
import workspaces from "@/features/workspaces/server/route";
import members from "@/features/members/server/route";
import projects from "@/features/projects/server/route";
import tasks from "@/features/tasks/server/route";
//import { auth } from "@/auth";
import { authMiddleware } from "@/features/auth/server/authMiddleware";
//import { authUser } from "@/lib/dbService/users";

//export const runtime = "edge";

const app = new Hono().basePath("/api");

app.use("*", authMiddleware);

const routes = app
  .route("/workspace", workspaces)
  .route("/members", members)
  .route("/projects", projects)
  .route("/tasks", tasks);

export const POST = handle(app);
export const GET = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);

export type AppType = typeof routes;
