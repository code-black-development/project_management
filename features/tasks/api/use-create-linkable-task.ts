import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";
import { toast } from "sonner";

type ResponseType = InferResponseType<
  (typeof client.api.tasks)["children"]["$post"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.tasks)["children"]["$post"]
>;

export function useCreateLinkableTask() {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.tasks["children"].$post({ json });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }
      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Task linked");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["linkable-tasks"] });
    },
    onError: () => {
      toast.error("Failed to link task");
    },
  });
  return mutation;
}
