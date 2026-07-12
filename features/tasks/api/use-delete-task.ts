import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";
import { toast } from "sonner";

type ResponseType = InferResponseType<
  (typeof client.api.tasks)[":taskId"]["$delete"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.tasks)[":taskId"]["$delete"]
>;

export function useDeleteTask() {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param }) => {
      const response = await client.api.tasks[":taskId"].$delete({
        param,
      });

      if (!response.ok) {
        throw new Error("Failed to archive task");
      }
      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Task archived");
      queryClient.removeQueries({ queryKey: ["tasks", data.id], exact: true });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: () => {
      toast.error("Failed to archive task");
    },
  });
  return mutation;
}
