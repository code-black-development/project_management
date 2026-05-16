import prisma from "@/prisma/prisma";
import { Prisma, TaskStatus } from "@prisma/client";

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  emailVerified: true,
  lastLoginAt: true,
} satisfies Prisma.UserSelect;

export const getMembersByWorkspaceId = async (workspaceId: string) => {
  return await prisma.member.findMany({
    where: {
      workspaceId,
    },
    include: {
      user: {
        select: safeUserSelect,
      },
    },
  });
};

export const getWorkspaceMembersWithStats = async (workspaceId: string) => {
  return await prisma.member.findMany({
    where: {
      workspaceId,
    },
    select: {
      id: true,
      workspaceId: true,
      userId: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: safeUserSelect,
      },
      _count: {
        select: {
          assignedTasks: true,
          createdTasks: true,
          Worklog: true,
        },
      },
    },
    orderBy: [{ role: "asc" }, { user: { name: "asc" } }],
  });
};

export const getWorkspaceMemberDetails = async (
  workspaceId: string,
  memberId: string
) => {
  const member = await prisma.member.findFirst({
    where: {
      id: memberId,
      workspaceId,
    },
    select: {
      id: true,
      workspaceId: true,
      userId: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: safeUserSelect,
      },
      _count: {
        select: {
          assignedTasks: true,
          createdTasks: true,
          Worklog: true,
        },
      },
      assignedTasks: {
        select: {
          id: true,
          name: true,
          status: true,
          dueDate: true,
          updatedAt: true,
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ updatedAt: "desc" }],
        take: 8,
      },
      createdTasks: {
        select: {
          id: true,
          name: true,
          status: true,
          updatedAt: true,
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ updatedAt: "desc" }],
        take: 5,
      },
      Worklog: {
        select: {
          id: true,
          timeSpent: true,
          dateWorked: true,
          task: {
            select: {
              id: true,
              name: true,
              project: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: [{ dateWorked: "desc" }],
        take: 8,
      },
    },
  });

  if (!member) {
    return null;
  }

  const [completedAssignedTasks, overdueAssignedTasks, worklogSummary] =
    await prisma.$transaction([
      prisma.task.count({
        where: {
          assigneeId: member.id,
          status: TaskStatus.DONE,
        },
      }),
      prisma.task.count({
        where: {
          assigneeId: member.id,
          status: {
            not: TaskStatus.DONE,
          },
          dueDate: {
            lt: new Date(),
          },
        },
      }),
      prisma.worklog.aggregate({
        where: {
          memberId: member.id,
        },
        _sum: {
          timeSpent: true,
        },
        _max: {
          dateWorked: true,
        },
      }),
    ]);

  return {
    ...member,
    stats: {
      assignedTasks: member._count.assignedTasks,
      completedAssignedTasks,
      openAssignedTasks: member._count.assignedTasks - completedAssignedTasks,
      overdueAssignedTasks,
      createdTasks: member._count.createdTasks,
      worklogEntries: member._count.Worklog,
      totalLoggedMinutes: worklogSummary._sum.timeSpent ?? 0,
      lastWorkedAt: worklogSummary._max.dateWorked,
    },
  };
};

export const getMemberById = async (id: string) => {
  return await prisma.member.findUnique({
    where: {
      id,
    },
  });
};

export const getMemberByUserIdAndWorkspaceId = async (
  userId: string,
  workspaceId: string
) => {
  return await prisma.member.findFirst({
    where: {
      userId,
      workspaceId,
    },
  });
};

export const getMemberWithUserByUserIdAndWorkspaceId = async (
  userId: string,
  workspaceId: string
) => {
  return await prisma.member.findFirst({
    where: {
      userId,
      workspaceId,
    },
    include: {
      user: true,
    },
  });
};

/** members get the role: member by default due to db schema */
export const addMember = async (userId: string, workspaceId: string) => {
  return await prisma.member.create({
    data: {
      userId,
      workspaceId,
    },
  });
};

export const deleteMember = async (id: string) => {
  return await prisma.member.delete({
    where: {
      id,
    },
  });
};

export const getMembersbyUserId = async (userId: string) => {
  return await prisma.member.findMany({
    where: {
      userId,
    },
  });
};

export const deleteAllMembersByUserId = async (userId: string) => {
  return await prisma.member.deleteMany({
    where: {
      userId,
    },
  });
};

export const checkIfUserIsAdmin = async (
  userId: string,
  workspaceId: string
) => {
  const member = await prisma.member.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  return !!(member && member.role === "admin");
};
