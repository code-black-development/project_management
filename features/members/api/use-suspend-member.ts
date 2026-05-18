"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

interface SuspendMemberRequest {
  memberId: string;
  suspended: boolean;
  workspaceId: string;
}

export const useSuspendMember = () => {
  const queryClient = useQueryClient();

  return useMutation<{ data: { id: string; suspended: boolean } }, Error, SuspendMemberRequest>({
    mutationFn: async ({ memberId, suspended, workspaceId }) => {
      const response = await fetch(`/api/members/${memberId}/suspend`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suspended, workspaceId }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to update member");
      }

      return response.json();
    },
    onSuccess: (_data, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ["members", workspaceId] });
    },
  });
};
