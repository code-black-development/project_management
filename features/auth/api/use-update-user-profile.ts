"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface UpdateUserProfileRequest {
  name: string;
}

interface UpdateUserProfileResponse {
  data: {
    id: string;
    name: string;
    email: string;
  };
}

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    UpdateUserProfileResponse,
    Error,
    { json: UpdateUserProfileRequest }
  >({
    mutationFn: async ({ json }) => {
      const response = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(json),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  return mutation;
};
