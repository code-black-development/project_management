import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "@/features/auth/server/authMiddleware";
import { getMemberByUserIdAndWorkspaceId } from "@/lib/dbService/workspace-members";
import {
  getWorkspaceDocuments,
  getDocumentById,
} from "@/lib/dbService/documents";

const app = new Hono()
  .get(
    "/",
    zValidator("query", z.object({ workspaceId: z.string() })),
    authMiddleware,
    async (c) => {
      const user = c.get("userId");
      const { workspaceId } = c.req.valid("query");

      // Check if user is a member of the workspace
      const member = await getMemberByUserIdAndWorkspaceId(user, workspaceId);
      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const documents = await getWorkspaceDocuments(workspaceId);
      return c.json({ data: documents });
    }
  )
  .get("/:documentId", authMiddleware, async (c) => {
    const user = c.get("userId");
    const { documentId } = c.req.param();

    const document = await getDocumentById(documentId);
    if (!document) {
      return c.json({ error: "Document not found" }, 404);
    }

    // Check if user is a member of the workspace that owns this document
    const member = await getMemberByUserIdAndWorkspaceId(
      user,
      document.task.workspaceId
    );
    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    return c.json({ data: document });
  });

export default app;
