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
import { createWorkspaceInvites } from "@/lib/dbService/workspace-invites";
import { checkIfUserIsAdmin } from "@/lib/dbService/workspace-members";
import { uploadImageToLocalStorage } from "@/lib/image-upload";
import { TaskStatus } from "@prisma/client";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import {
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
    // console.log("name", name);
    //console.log("image", image);
    // console.log("user id", userId);
    let fileUrl: string | null = null;
    if (image instanceof File) {
      fileUrl = await uploadImageToLocalStorage(image);
    }
    console.log("file url", fileUrl);
    const workspace = await createWorkspace(name, fileUrl, userId!);

    return c.json({ data: workspace });
  })
  .patch(
    "/:workspaceId",
    zValidator("form", updateWorkspaceSchema),
    async (c) => {
      const userId = c.get("userId");
      const { workspaceId } = c.req.param();
      const { name, image } = c.req.valid("form");

      console.log("name", name);
      console.log("image", image);

      console.log("user id", userId);

      let fileUrl: string | null;

      if (image instanceof File) {
        fileUrl = await uploadImageToLocalStorage(image);
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
    const userId = c.get("userId");
    const { workspaceId } = c.req.param();
    const workspace = await deleteWorkspace(workspaceId, userId);
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

      // Process each invite
      for (const email of invites) {
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
            console.log("Added existing user to workspace:", email);
          } else {
            // Create invite for new user
            console.log("Creating invite for new user:", email);
            console.log("Workspace ID:", workspaceId);
            console.log("Email array:", [email]);
            
            const dbInvites = await createWorkspaceInvites(workspaceId, [
              email,
            ]);
            const invite = dbInvites[0];
            
            console.log("Created invite:", invite);

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
            console.log("Sent invitation to new user:", email);
          }
        } catch (error) {
          console.error(`Failed to process invite for ${email}:`, error);
          results.errors.push({
            email,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      console.log("Invitation processing completed:", results);
      return c.json({ data: results });
    }
  )
  /* 
  * this may not be used anymore - now this is done via useSignUp - we may need to bring this back though and edit it for when an existing member is invited
  * useSignUp
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
      //TODO: this is notimplemented at all  - redo this
      const member = await addMember(isInvited.userId, workspaceId);
      //by as the invite is tied to a user it cannot be reused by anyone else. Invite will be deleted after 7 days by a CRON job
      return c.json({ data: member });
    }
  ) */
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
