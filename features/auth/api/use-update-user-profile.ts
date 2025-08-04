"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface UpdateUserProfileRequest {
  name: string;
  image?: File | string;
}

interface UpdateUserProfileResponse {
  data: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    UpdateUserProfileResponse,
    Error,
    { form: UpdateUserProfileRequest }
  >({
    mutationFn: async ({ form: formValues }) => {
      const formData = new FormData();
      formData.append("name", formValues.name);

      if (formValues.image !== undefined) {
        if (formValues.image instanceof File) {
          formData.append("image", formValues.image);
        } else {
          formData.append("image", formValues.image || "");
        }
      }

      const response = await fetch("/api/users/profile", {
        method: "PATCH",
        body: formData,
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
