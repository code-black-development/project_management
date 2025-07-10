import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type ResponseType = InferResponseType<(typeof client.api.tasks)["$post"], 200>;
type RequestType = InferRequestType<(typeof client.api.tasks)["$post"]>;

export function useCreateTask() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      console.log("useCreateTask - Sending data:", json);
      const response = await client.api.tasks.$post({ json });

      console.log("useCreateTask - Response status:", response.status);
      console.log("useCreateTask - Response ok:", response.ok);

      if (!response.ok) {
        const errorData = await response.text();
        console.log("useCreateTask - Error response:", errorData);
        throw new Error(
          `Failed to create task: ${response.status} - ${errorData}`
        );
      }
      const result = await response.json();
      console.log("useCreateTask - Success result:", result);
      return result;
    },
    onSuccess: ({ data }) => {
      console.log("useCreateTask - Success:", data);
      toast.success("Task created");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      //router.push(`/workspaces/${data.workspaceId}/task/${data.id}`);
    },
    onError: (error) => {
      console.error("useCreateTask - Error:", error);
      toast.error(`Failed to create task: ${error.message}`);
    },
  });
  return mutation;
}
