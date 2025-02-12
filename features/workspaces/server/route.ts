import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createWorkspaceSchema, updateWorkspaceSchema } from "../schemas";
import { HTTPException } from "hono/http-exception";
import { join } from "path";
import { writeFile } from "fs/promises";
import {
  createWorkspace,
  deleteWorkspace,
  getWorkspaceByUserId,
  updateWorkspace,
} from "@/lib/dbService/workspaces";
import { getSessionUserId } from "@/lib/authFunctions";
import { z } from "zod";
import {
  createWorkspaceInvite,
  getWorkspaceInvite,
} from "@/lib/dbService/workspace-invites";
import {
  addMember,
  checkIfUserIsAdmin,
} from "@/lib/dbService/workspace-members";

const app = new Hono()
  .get("/", async (c) => {
    const userId = await getSessionUserId(c);
    if (!userId) {
      throw new HTTPException(401, { message: "Custom error message" });
    }
    const workspaces = await getWorkspaceByUserId(userId);
    return c.json({ data: workspaces });
  })
  .post("/", zValidator("form", createWorkspaceSchema), async (c) => {
    const userId = await getSessionUserId(c);
    if (!userId) {
      throw new HTTPException(401, { message: "Custom error message" });
    }
    const { name, image } = c.req.valid("form");

    let fileUrl: string | null = null;
    if (image instanceof File) {
      const uploadDir = "uploaded_files";
      const buffer = Buffer.from(await image.arrayBuffer());
      const uploadDirPath = join(process.cwd(), "public", uploadDir);
      await writeFile(`${uploadDirPath}/${image.name}`, buffer);
      fileUrl = `${uploadDir}/${image.name}`;
    }

    const workspace = await createWorkspace(name, fileUrl, userId!);

    return c.json({ data: workspace });
  })
  .patch(
    "/:workspaceId",
    zValidator("form", updateWorkspaceSchema),
    async (c) => {
      const userId = await getSessionUserId(c);
      if (!userId) {
        throw new HTTPException(401, { message: "Custom error message" });
      }
      const { workspaceId } = c.req.param();
      const { name, image } = c.req.valid("form");

      console.log("name", name);
      console.log("image", image);

      console.log("user id", userId);

      let fileUrl: string | null;

      if (image instanceof File) {
        const uploadDir = "uploaded_files";
        const buffer = Buffer.from(await image.arrayBuffer());
        const uploadDirPath = join(process.cwd(), "public", uploadDir);
        await writeFile(`${uploadDirPath}/${image.name}`, buffer);
        fileUrl = `${uploadDir}/${image.name}`;
      } else {
        fileUrl = null;
      }

      const response = await updateWorkspace(userId, workspaceId, {
        name,
        ...((image instanceof File || !image) && { image: fileUrl }),
      });

      return c.json({ data: response });
    }
  )
  .delete("/:workspaceId", async (c) => {
    const userId = await getSessionUserId(c);
    if (!userId) {
      throw new HTTPException(401, { message: "Custom error message" });
    }
    const { workspaceId } = c.req.param();
    const workspace = await deleteWorkspace(workspaceId, userId);
    return c.json({ data: workspace });
  })
  .post(
    "/:workspaceId/invite",
    zValidator("json", z.object({ invitedUserId: z.string() })),
    async (c) => {
      const userId = await getSessionUserId(c);
      if (!userId) {
        throw new HTTPException(401, { message: "Custom error message" });
      }
      const { workspaceId } = c.req.param();
      const { invitedUserId } = c.req.valid("json");

      const isWorkspaceAdmin = await checkIfUserIsAdmin(userId, workspaceId);
      if (!isWorkspaceAdmin) {
        throw new HTTPException(403, {
          message: "You are not authorized to invite users",
        });
      }
      const invite = await createWorkspaceInvite(workspaceId, invitedUserId);

      //TODO - send email to the user with the invite link
      return c.json({ data: invite });
    }
  )
  .post(
    "/:workspaceId/join",
    zValidator("json", z.object({ code: z.string() })),
    async (c) => {
      const { workspaceId } = c.req.param();
      const { code } = c.req.valid("json");
      //check if invite code is valid and if the user is already a member
      //if not add user to workspace
      const isInvited = await getWorkspaceInvite(code);
      if (!isInvited) {
        throw new HTTPException(404, { message: "Invalid invite code" });
      }
      const member = await addMember(isInvited.userId, workspaceId);
      //by as the invite is tied to a user it cannot be reused by anyone else. Invite will be deleted after 7 days by a CRON job
      return c.json({ data: member });
    }
  );

export default app;
