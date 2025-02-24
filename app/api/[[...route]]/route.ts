import { Hono } from "hono";
import { handle } from "hono/vercel";
import workspaces from "@/features/workspaces/server/route";
import members from "@/features/members/server/route";
import projects from "@/features/projects/server/route";
import tasks from "@/features/tasks/server/route";
import { authMiddleware } from "@/features/auth/server/authMiddleware";

//export const runtime = "edge";

const app = new Hono().basePath("/api");

app.use("*", authMiddleware);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
