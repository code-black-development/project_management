import { Hono } from "hono";
import { authMiddleware } from "@/features/auth/server/authMiddleware";
import { getMemberByUserIdAndWorkspaceId } from "@/lib/dbService/workspace-members";
import {
  getWorkspaceTimeReport,
  getProjectTimeReports,
  getUserTimeReports,
} from "@/lib/dbService/reports";

const app = new Hono().get("/:workspaceId", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const { workspaceId } = c.req.param();

  // Verify user is a member of the workspace
  const member = await getMemberByUserIdAndWorkspaceId(userId, workspaceId);
  if (!member) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const [workspaceReport, projectReports, userReports] = await Promise.all([
      getWorkspaceTimeReport(workspaceId),
      getProjectTimeReports(workspaceId),
      getUserTimeReports(workspaceId),
    ]);

    return c.json({
      data: {
        workspace: workspaceReport,
        projects: projectReports,
        users: userReports,
      },
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return c.json({ error: "Failed to fetch reports" }, 500);
  }
});

export default app;
