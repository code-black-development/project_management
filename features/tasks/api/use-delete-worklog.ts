import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";
import { toast } from "sonner";

type ResponseType = InferResponseType<
  (typeof client.api.tasks)["worklog"][":worklogId"]["$delete"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.tasks)["worklog"][":worklogId"]["$delete"]
>;

export function useDeleteWorklog() {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param }) => {
      const response = await client.api.tasks["worklog"][":worklogId"].$delete({
        param,
      });

      if (!response.ok) {
        throw new Error("Failed to delete worklog");
      }
      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Worklog deleted");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: () => {
      toast.error("Failed to delete worklog");
    },
  });
  return mutation;
}
