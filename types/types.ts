import { Task, Member, User, Project } from "@prisma/client";
export type TaskWithUser = Omit<Task, "dueDate"> & { dueDate: string } & {
  assignee: Member & { user: User };
} & {
  project: Project;
};
