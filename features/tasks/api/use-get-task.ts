"use client";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
interface UseGetTasksProps {
  taskId?: string | null;
}

export const useGetTask = ({ taskId }: UseGetTasksProps) => {
  return useQuery({
    queryKey: ["tasks", taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const response = await client.api.tasks[":taskId"].$get({
        param: { taskId: taskId! },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch task");
      }
      const { data } = await response.json();
      return data;
    },
  });
};
