import prisma from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail, generateFrozenWorkspaceEmailTemplate } from "@/lib/mailing-functions";
import { subDays, addDays, startOfDay, endOfDay } from "date-fns";

const appOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://app.localhost:3000";

export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get("x-cron-secret") ?? request.headers.get("authorization");
  if (!process.env.CRON_SECRET || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  let deleted = 0;
  let warned = 0;

  try {
    // 1. Hard-delete workspaces frozen > 30 days ago
    const cutoffDate = subDays(now, 30);
    const expiredWorkspaces = await prisma.workspace.findMany({
      where: {
        status: "FROZEN",
        frozenAt: { lt: cutoffDate },
      },
    });

    if (expiredWorkspaces.length > 0) {
      // Group by user for email notification
      const userWorkspaceMap = new Map<string, string[]>();
      for (const ws of expiredWorkspaces) {
        const existing = userWorkspaceMap.get(ws.user) ?? [];
        existing.push(ws.name);
        userWorkspaceMap.set(ws.user, existing);
      }

      // Send deletion notification emails
      for (const [userId, workspaceNames] of userWorkspaceMap) {
        try {
          const user = await prisma.user.findUnique({ where: { id: userId } });
          if (user?.email) {
            const template = generateFrozenWorkspaceEmailTemplate(
              workspaceNames,
              "now (deleted)",
              `${appOrigin}/billing`
            );
            await sendEmail(
              user.email,
              "Your frozen workspaces have been deleted",
              template
            );
          }
        } catch (err) {
          console.error(`Failed to send deletion email to user ${userId}:`, err);
        }
      }

      const expiredIds = expiredWorkspaces.map((ws) => ws.id);
      await prisma.workspace.deleteMany({
        where: { id: { in: expiredIds } },
      });
      deleted = expiredIds.length;
    }

    // 2. Warn workspaces freezing in ~7 days (frozen 23 days ago → 7 days left)
    const warnAt7Start = startOfDay(subDays(now, 23));
    const warnAt7End = endOfDay(subDays(now, 23));
    const sevenDayWarningWorkspaces = await prisma.workspace.findMany({
      where: {
        status: "FROZEN",
        frozenAt: { gte: warnAt7Start, lte: warnAt7End },
      },
    });

    if (sevenDayWarningWorkspaces.length > 0) {
      const userWorkspaceMap7 = new Map<string, string[]>();
      for (const ws of sevenDayWarningWorkspaces) {
        const existing = userWorkspaceMap7.get(ws.user) ?? [];
        existing.push(ws.name);
        userWorkspaceMap7.set(ws.user, existing);
      }

      for (const [userId, workspaceNames] of userWorkspaceMap7) {
        try {
          const user = await prisma.user.findUnique({ where: { id: userId } });
          if (user?.email) {
            const deletionDate = addDays(warnAt7Start, 30).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            });
            const template = generateFrozenWorkspaceEmailTemplate(
              workspaceNames,
              deletionDate,
              `${appOrigin}/billing`
            );
            await sendEmail(
              user.email,
              "Your workspaces will be deleted in 7 days",
              template
            );
            warned++;
          }
        } catch (err) {
          console.error(`Failed to send 7-day warning email to user ${userId}:`, err);
        }
      }
    }

    // 3. Final warning for workspaces freezing in ~1 day (frozen 29 days ago → 1 day left)
    const warnAt1Start = startOfDay(subDays(now, 29));
    const warnAt1End = endOfDay(subDays(now, 29));
    const oneDayWarningWorkspaces = await prisma.workspace.findMany({
      where: {
        status: "FROZEN",
        frozenAt: { gte: warnAt1Start, lte: warnAt1End },
      },
    });

    if (oneDayWarningWorkspaces.length > 0) {
      const userWorkspaceMap1 = new Map<string, string[]>();
      for (const ws of oneDayWarningWorkspaces) {
        const existing = userWorkspaceMap1.get(ws.user) ?? [];
        existing.push(ws.name);
        userWorkspaceMap1.set(ws.user, existing);
      }

      for (const [userId, workspaceNames] of userWorkspaceMap1) {
        try {
          const user = await prisma.user.findUnique({ where: { id: userId } });
          if (user?.email) {
            const deletionDate = addDays(warnAt1Start, 30).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            });
            const template = generateFrozenWorkspaceEmailTemplate(
              workspaceNames,
              deletionDate,
              `${appOrigin}/billing`
            );
            await sendEmail(
              user.email,
              "Final warning: Your workspaces will be deleted tomorrow",
              template
            );
            warned++;
          }
        } catch (err) {
          console.error(`Failed to send 1-day warning email to user ${userId}:`, err);
        }
      }
    }
  } catch (err) {
    console.error("Cron cleanup-frozen-workspaces error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ deleted, warned });
}
