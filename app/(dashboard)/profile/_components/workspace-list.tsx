"use client";

import Link from "next/link";
import WorkspaceAvatar from "@/features/workspaces/_components/workspace-avatar";

interface WorkspaceListItem {
  id: string;
  name: string;
  image: string | null;
  role: string;
}

interface WorkspaceListProps {
  memberships: WorkspaceListItem[];
}

const WorkspaceList = ({ memberships }: WorkspaceListProps) => {
  if (memberships.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        You are not a member of any workspace yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-y-2">
      {memberships.map(({ id, name, image, role }) => (
        <li key={id}>
          <Link
            href={`/workspaces/${id}`}
            className="flex items-center justify-between gap-x-4 px-3 py-2.5 rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-x-3 min-w-0">
              <WorkspaceAvatar
                name={name}
                image={image || undefined}
                className="size-7 shrink-0"
              />
              <p className="text-sm font-medium text-foreground truncate">{name}</p>
            </div>
            <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
              {role}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default WorkspaceList;
