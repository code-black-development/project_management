"use client";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface UseGetTasksProps {
  workspaceId?: string | null;
  projectId?: string | null;
  status?: string | null;
  assigneeId?: string | null;
  dueDate?: string | null;
  search?: string | null;
  limit?: number;
}

export const useGetTasks = ({
  workspaceId,
  projectId,
  status,
  assigneeId,
  dueDate,
  search,
  limit = 250,
}: UseGetTasksProps) => {
  return useQuery({
    queryKey: [
      "tasks",
      workspaceId,
      projectId,
      status,
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
          status: status ?? undefined,
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
