import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type ResponseType = InferResponseType<(typeof client.api.tasks)["$post"], 200>;
type RequestType = InferRequestType<(typeof client.api.tasks)["$post"]>;

interface UseCreateTaskOptions {
  redirectOnSuccess?: boolean;
  onSuccess?: (data: ResponseType["data"]) => void;
}

export function useCreateTask(options: UseCreateTaskOptions = {}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { redirectOnSuccess = true, onSuccess } = options;

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.tasks.$post({ json });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `Failed to create task: ${response.status} - ${errorData}`
        );
      }
      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Task created");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      
      if (onSuccess) {
        onSuccess(data);
      }
      
      // Redirect to task detail page for new tasks
      if (redirectOnSuccess) {
        const redirectUrl = `/workspaces/${data.workspaceId}/tasks/${data.id}`;
        // Small delay to ensure modal closes first
        setTimeout(() => {
          router.push(redirectUrl);
        }, 100);
      }
    },
    onError: (error) => {
      toast.error(`Failed to create task: ${error.message}`);
    },
  });
  return mutation;
}
