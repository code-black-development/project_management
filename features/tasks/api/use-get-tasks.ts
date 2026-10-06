"use client";
import { useQuery } from "@tanstack/react-query";
import { TaskPriority, TaskStatus } from "@prisma/client";
import { client } from "@/lib/rpc";

interface UseGetTasksProps {
  workspaceId?: string | null;
  projectId?: string | null;
  statuses?: TaskStatus[] | null;
  priorities?: TaskPriority[] | null;
  assigneeId?: string | null;
  dueDate?: string | null;
  search?: string | null;
  limit?: number;
}

export const useGetTasks = ({
  workspaceId,
  projectId,
  statuses,
  priorities,
  assigneeId,
  dueDate,
  search,
  limit = 250,
}: UseGetTasksProps) => {
  const statusFilter = statuses?.length ? statuses.join(",") : null;
  const priorityFilter = priorities?.length ? priorities.join(",") : null;

  return useQuery({
    queryKey: [
      "tasks",
      workspaceId,
      projectId,
      statusFilter,
      priorityFilter,
      assigneeId,
      dueDate,
      search,
      limit,
    ],
    enabled: !!workspaceId,
    queryFn: async () => {
      const response = await client.api.tasks.$get({
        query: {
          workspaceId: workspaceId!,
          projectId: projectId ?? undefined,
          status: statusFilter ?? undefined,
          priority: priorityFilter ?? undefined,
          assigneeId: assigneeId ?? undefined,
          dueDate: dueDate ?? undefined,
          search: search ?? undefined,
          limit: String(limit),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      const { data } = await response.json();
      return data;
    },
  });
};
