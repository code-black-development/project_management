import {
  Task,
  Member,
  User,
  Project,
  Workspace,
  Worklog,
} from "@prisma/client";

export type TaskWithUser = TaskSafeDate & {
  assignee: (MemberSafeDate & { user: UserSafeDate }) | null;
} & {
  project: ProjectSafeDate;
} & { worklogs: WorklogType[] };

export type ProjectSafeDate = Omit<Project, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type TaskSafeDate = Omit<
  Task,
  "createdAt" | "updatedAt" | "dueDate" | "timeEstimate"
> & {
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  timeEstimate: string | null;
};

export type MemberSafeDate = Omit<Member, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type UserSafeDate = Omit<User, "emailVerified"> & {
  emailVerified: string | null;
};

export type WorkspaceSafeDates = Omit<Workspace, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type WorklogType = Omit<
  Worklog,
  "createdAt" | "updatedAt" | "dateWorked"
> & {
  createdAt: string;
  updatedAt: string;
  dateWorked: string;
};

export enum MemberRole {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}
