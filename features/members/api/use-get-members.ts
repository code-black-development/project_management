"use client";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
interface UseGetMembersProps {
  workspaceId?: string | null;
}

export const useGetMembers = ({ workspaceId }: UseGetMembersProps) => {
  return useQuery({
    queryKey: ["members", workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const response = await client.api.members.$get({
        query: { workspaceId: workspaceId! },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch members");
      }
      return await response.json();
    },
  });
};
