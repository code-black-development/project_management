import { Task, Member, User, Project } from "@prisma/client";

export type TaskWithUser = TaskSafeDate & {
  assignee: (MemberSafeDate & { user: UserSafeDate }) | null;
} & {
  project: ProjectSafeDate;
};

export type ProjectSafeDate = Omit<Project, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type TaskSafeDate = Omit<Task, "createdAt" | "updatedAt" | "dueDate"> & {
  createdAt: string;
  updatedAt: string;
  dueDate: string;
};

export type MemberSafeDate = Omit<Member, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type UserSafeDate = Omit<User, "emailVerified"> & {
  emailVerified: string | null;
};
