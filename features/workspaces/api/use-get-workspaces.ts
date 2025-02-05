"use client";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

export const useGetWorkspaces = () => {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const response = await client.api.workspace.$get();

      if (!response.ok) {
        throw new Error("Failed to fetch workspaces");
      }
      return await response.json();
    },
  });
};
