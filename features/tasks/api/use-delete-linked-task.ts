import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";
import { toast } from "sonner";

type ResponseType = InferResponseType<
  (typeof client.api.tasks)["children"]["$delete"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.tasks)["children"]["$delete"]
>;

export function useDeleteLinkedTask() {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.tasks["children"].$delete({
        json,
      });

      if (!response.ok) {
        throw new Error("Failed to archive child task");
      }
      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Child task archived");
      queryClient.invalidateQueries({ queryKey: ["linkable-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", data] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: () => {
      toast.error("Failed to archive child task");
    },
  });
  return mutation;
}
