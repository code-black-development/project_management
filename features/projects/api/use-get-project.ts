"use client";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface UseGetProjectProps {
  projectId?: string | null;
}

export const useGetProject = ({ projectId }: UseGetProjectProps) => {
  return useQuery({
    queryKey: ["project", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const response = await client.api.projects[":projectId"].$get({
        param: { projectId: projectId! },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch project");
      }
      const { data } = await response.json();
      return data;
    },
  });
};
