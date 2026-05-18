"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

interface UpdateMemberUsernameRequest {
  memberId: string;
  name: string;
  workspaceId: string;
}

interface UpdateMemberUsernameResponse {
  data: {
    id: string;
    name: string;
    email: string;
  };
}

export const useUpdateMemberUsername = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateMemberUsernameResponse, Error, UpdateMemberUsernameRequest>({
    mutationFn: async ({ memberId, name, workspaceId }) => {
      const response = await fetch(`/api/members/${memberId}/username`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, workspaceId }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to update username");
      }

      return response.json();
    },
    onSuccess: (_data, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ["members", workspaceId] });
    },
  });
};
