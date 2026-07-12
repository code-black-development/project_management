import {
  Task,
  Member,
  User,
  Project,
  Workspace,
  Worklog,
  TaskAsset,
} from "@prisma/client";

export type TaskWithUser = TaskSafeDate & {
  assignee: (MemberSafeDate & { user: UserSafeDate }) | null;
} & {
  createdBy: MemberSafeDate & { user: UserSafeDate };
} & {
  project: ProjectSafeDate;
} & { worklogs: WorklogType[] } & {
  children: TaskWithUser[];
} & {
  assets: AssetSafeDate[];
} & {
  category?: { id: string; name: string; icon: string | null } | null;
} & {
  parent?:
    | (TaskSafeDate & {
        project: ProjectSafeDate;
        assignee: (MemberSafeDate & { user: UserSafeDate }) | null;
        createdBy: MemberSafeDate & { user: UserSafeDate };
      })
    | null;
};

export type TaskListItem = TaskSafeDate & {
  assignee: (MemberSafeDate & { user: UserSafeDate }) | null;
  project: ProjectSafeDate;
  category?: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
};

export type ProjectSafeDate = Omit<Project, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type TaskSafeDate = Omit<
  Task,
  | "createdAt"
  | "updatedAt"
  | "dueDate"
  | "timeEstimate"
  | "recurrenceEndDate"
  | "archivedAt"
> & {
  createdAt: string;
  updatedAt: string;
  dueDate: string | null;
  timeEstimate: string | null;
  recurrenceEndDate: string | null;
  archivedAt: string | null;
};

export type MemberSafeDate = Omit<Member, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type UserSafeDate = Omit<
  User,
  | "emailVerified"
  | "lastLoginAt"
  | "resetTokenExpiry"
  | "password"
  | "resetToken"
> & {
  emailVerified: string | null;
  lastLoginAt?: string | null;
};

export type AssetSafeDate = Omit<TaskAsset, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type TaskAssetFile = {
  name: string;
  file: string;
  type: string;
};

export type WorkspaceSafeDates = Omit<Workspace, "createdAt" | "updatedAt" | "frozenAt"> & {
  createdAt: string;
  updatedAt: string;
  frozenAt: string | null;
};

export type WorklogType = Omit<
  Worklog,
  "createdAt" | "updatedAt" | "dateWorked"
> & {
  createdAt: string;
  updatedAt: string;
  dateWorked: string;
  workDescription: string | null;
  member?: {
    id: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  };
};

export enum MemberRole {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}
