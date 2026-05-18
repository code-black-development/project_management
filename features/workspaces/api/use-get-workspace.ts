"use client";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface UseGetWorkspaceProps {
  workspaceId?: string | null;
}

export const useGetWorkspace = ({ workspaceId }: UseGetWorkspaceProps) => {
  return useQuery({
    queryKey: ["workspace", workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const response = await client.api.workspace[":workspaceId"].$get({
        param: { workspaceId: workspaceId! },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch workspace");
      }
      return await response.json();
    },
  });
};
