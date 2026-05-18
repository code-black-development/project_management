import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  createWorkspaceInvitesSchema,
  createWorkspaceSchema,
  updateWorkspaceSchema,
} from "../schemas";
import { HTTPException } from "hono/http-exception";
import {
  createWorkspace,
  deleteWorkspace,
  getWorkspaceById,
  getWorkspaceByUserId,
  updateWorkspace,
} from "@/lib/dbService/workspaces";
import { getProjectImageUrlsByWorkspaceId } from "@/lib/dbService/projects";
import { getOrCreateWorkspaceInvite } from "@/lib/dbService/workspace-invites";
import { checkIfUserIsAdmin } from "@/lib/dbService/workspace-members";
import {
  uploadToS3,
  deleteManyFromS3,
  extractS3KeyFromUrl,
} from "@/lib/s3";
import { TaskStatus } from "@prisma/client";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import {
  getTaskAssetUrlsByWorkspaceId,
  getWorkspaceOverdueTasks,
  getWorkspaceTasksInDateRange,
} from "@/lib/dbService/tasks";
import {
  generateEmailTemplate,
  generateExistingUserWelcomeTemplate,
  generateInviteLink,
  sendEmail,
} from "@/lib/mailing-functions";
import { getUserById, getUserByEmail } from "@/lib/dbService/users";
import {
  addMember,
  getMemberByUserIdAndWorkspaceId,
} from "@/lib/dbService/workspace-members";

const app = new Hono()
  .get("/", async (c) => {
    const userId = c.get("userId");
    const workspaces = await getWorkspaceByUserId(userId);
    return c.json({ data: workspaces });
  })
  .post("/", zValidator("form", createWorkspaceSchema), async (c) => {
    const { name, image } = c.req.valid("form");
    const userId = c.get("userId");

    let fileUrl: string | null = null;

    // Upload image to S3 if provided
    if (image instanceof File && image.size > 0) {
      try {
        const uploadResult = await uploadToS3(image, "workspaces", image.name);
        fileUrl = uploadResult.url;
      } catch (error) {
        console.error("Failed to upload image:", error);
        return c.json({ error: "Failed to upload image" }, 500);
      }
    }

    let workspace;
    try {
      workspace = await createWorkspace(name, fileUrl, userId!);
    } catch (error) {
      await deleteManyFromS3([fileUrl], "uploaded workspace image rollback");
      throw error;
    }

    return c.json({ data: workspace });
  })
  .patch(
    "/:workspaceId",
    zValidator("form", updateWorkspaceSchema),
    async (c) => {
      const userId = c.get("userId");
      const { workspaceId } = c.req.param();
      const { name, image } = c.req.valid("form");

      // Get existing workspace to check for old image
      const existingWorkspace = await getWorkspaceById(workspaceId);
      if (!existingWorkspace) {
        return c.json({ error: "Workspace not found" }, 404);
      }

      let fileUrl: string | null = existingWorkspace.image;
      let uploadedImageKey: string | null = null;
      const oldImageKey = existingWorkspace.image
        ? extractS3KeyFromUrl(existingWorkspace.image)
        : null;

      // Handle image update
      if (image instanceof File && image.size > 0) {
        try {
          // Upload new image to S3
          const uploadResult = await uploadToS3(
            image,
            "workspaces",
            image.name
          );
          fileUrl = uploadResult.url;
          uploadedImageKey = uploadResult.key;
        } catch (error) {
          console.error("Failed to upload image:", error);
          return c.json({ error: "Failed to upload image" }, 500);
        }
      } else if (!image) {
        fileUrl = null;
      }

      let response;
      try {
        response = await updateWorkspace(userId, workspaceId, {
          name,
          image: fileUrl,
        });
      } catch (error) {
        if (uploadedImageKey) {
          await deleteManyFromS3(
            [uploadedImageKey],
            "uploaded workspace image rollback"
          );
        }
        throw error;
      }

      const newImageKey = fileUrl ? extractS3KeyFromUrl(fileUrl) : null;
      if (oldImageKey && oldImageKey !== newImageKey) {
        await deleteManyFromS3([oldImageKey], "old workspace image");
      }

      return c.json({ data: response });
    }
  )
  .delete("/:workspaceId", async (c) => {
    const userId = c.get("userId");
    const { workspaceId } = c.req.param();

    // Get existing workspace to check for image cleanup
    const existingWorkspace = await getWorkspaceById(workspaceId);

    const projectImageUrls = await getProjectImageUrlsByWorkspaceId(workspaceId);
    const taskAssetUrls = await getTaskAssetUrlsByWorkspaceId(workspaceId);
    const s3Keys = [
      existingWorkspace?.image
        ? extractS3KeyFromUrl(existingWorkspace.image)
        : null,
      ...projectImageUrls.map((url) => extractS3KeyFromUrl(url)),
      ...taskAssetUrls.map((url) => extractS3KeyFromUrl(url)),
    ].filter((key): key is string => !!key);

    const workspace = await deleteWorkspace(workspaceId, userId);
    await deleteManyFromS3(s3Keys, "workspace files");
    return c.json({ data: workspace });
  })
  .post(
    "/:workspaceId/invite",
    zValidator("json", createWorkspaceInvitesSchema),
    async (c) => {
      const userId = c.get("userId");
      const { workspaceId } = c.req.param();
      const { invites } = c.req.valid("json");

      const isWorkspaceAdmin = await checkIfUserIsAdmin(userId, workspaceId);
      if (!isWorkspaceAdmin) {
        throw new HTTPException(403, {
          message: "You are not authorized to invite users",
        });
      }

      const inviter = await getUserById(userId);
      const workspace = await getWorkspaceById(workspaceId);

      if (!inviter || !workspace) {
        throw new HTTPException(404, {
          message: "Inviter or workspace not found",
        });
      }

      const results: {
        newUserInvites: string[];
        existingUserAdded: string[];
        alreadyMembers: string[];
        errors: { email: string; error: string }[];
      } = {
        newUserInvites: [],
        existingUserAdded: [],
        alreadyMembers: [],
        errors: [],
      };

      // Process each unique invite once to avoid duplicate emails in the same request.
      for (const email of [...new Set(invites)]) {
        try {
          // Check if user already exists
          const existingUser = await getUserByEmail(email);

          if (existingUser) {
            // Check if already a member
            const existingMember = await getMemberByUserIdAndWorkspaceId(
              existingUser.id,
              workspaceId
            );

            if (existingMember) {
              results.alreadyMembers.push(email);
              continue;
            }

            // Add existing user as member
            const newMember = await addMember(existingUser.id, workspaceId);

            // Send welcome email to existing user
            const welcomeTemplate = await generateExistingUserWelcomeTemplate(
              workspace.name,
              inviter.name || inviter.email
            );

            await sendEmail(
              email,
              `Welcome to ${workspace.name}`,
              welcomeTemplate
            );

            results.existingUserAdded.push(email);
          } else {
            // Reuse the existing invite row when the email was already invited.
            const invite = await getOrCreateWorkspaceInvite(workspaceId, email);

            // Send invite email to new user
            const emailTemplate = await generateEmailTemplate(
              generateInviteLink(invite.code),
              inviter.name || inviter.email
            );

            await sendEmail(
              email,
              "You have been invited to CodeFlow Pro",
              emailTemplate
            );

            results.newUserInvites.push(email);
          }
        } catch (error) {
          console.error(`Failed to process invite for ${email}:`, error);
          results.errors.push({
            email,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return c.json({ data: results });
    }
  )
  .get("/:workspaceId", async (c) => {
    const { workspaceId } = c.req.param();
    //TODO: check if the user is a member of the workspace
    const workspace = await getWorkspaceById(workspaceId);
    return c.json({ data: workspace });
  })
  .get("/:workspaceId/analytics", async (c) => {
    const { workspaceId } = c.req.param();

    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const thismonthTasks = await getWorkspaceTasksInDateRange(
      workspaceId,
      thisMonthStart,
      thisMonthEnd
    );

    const lastMonthTasks = await getWorkspaceTasksInDateRange(
      workspaceId,
      lastMonthStart,
      lastMonthEnd
    );
    const overdueProjectTasks = await getWorkspaceOverdueTasks(
      workspaceId,
      new Date()
    );

    const taskCount = thismonthTasks.length;
    const taskDifference = taskCount - lastMonthTasks.length;

    const thisMonthIncompleteTasks = thismonthTasks.filter(
      (task) => task.status !== TaskStatus.DONE
    );
    const lastMonthIncompleteTasks = lastMonthTasks.filter(
      (task) => task.status !== TaskStatus.DONE
    );
    const incompleteTaskCount = thisMonthIncompleteTasks.length;
    const incompleteTaskDifference =
      incompleteTaskCount - lastMonthIncompleteTasks.length;

    const thisMonthCompletedTasks = thismonthTasks.filter(
      (task) => task.status === TaskStatus.DONE
    );
    const lastMonthCompletedTasks = lastMonthTasks.filter(
      (task) => task.status === TaskStatus.DONE
    );
    const completedTaskCount = thisMonthCompletedTasks.length;
    const completedTaskDifference =
      completedTaskCount - lastMonthCompletedTasks.length;

    const overdueProjectTasksTotalCount = overdueProjectTasks.length;
    const thisMonthOverdueProjectTasks = overdueProjectTasks.filter(
      (task) =>
        task.createdAt >= thisMonthStart && task.createdAt <= thisMonthEnd
    );
    const lastMonthOverdueProjectTasks = overdueProjectTasks.filter(
      (task) =>
        task.createdAt >= lastMonthStart && task.createdAt <= lastMonthEnd
    );
    const lastMonthOverdueProjectTasksCount =
      lastMonthOverdueProjectTasks.length;
    const thisMonthOverdueProjectTasksCount =
      thisMonthOverdueProjectTasks.length;

    const overdueProjectTasksDifference =
      thisMonthOverdueProjectTasksCount - lastMonthOverdueProjectTasksCount;

    return c.json({
      taskCount,
      taskDifference,
      completedTaskCount,
      completedTaskDifference,
      incompleteTaskCount,
      incompleteTaskDifference,
      overdueProjectTasksTotalCount,
      overdueProjectTasksCount: thisMonthOverdueProjectTasksCount,
      overdueProjectTasksDifference,
    });
  });

export default app;
