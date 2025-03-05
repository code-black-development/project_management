"use client";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface UseGetTasksProps {
  taskId: string;
  projectId: string;
}

export const useGetLinkableTasks = ({
  taskId,
  projectId,
}: UseGetTasksProps) => {
  return useQuery({
    queryKey: ["linkable-tasks", projectId, taskId],
    queryFn: async () => {
      const response = await client.api.tasks["children"][":projectId"].$get({
        param: { projectId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      const { data } = await response.json();
      return data.filter((task: any) => task.id !== taskId);
    },
  });
};
