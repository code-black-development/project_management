import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";
import { toast } from "sonner";

type ResponseType = InferResponseType<
  (typeof client.api.tasks)["worklog"][":worklogId"]["$patch"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.tasks)["worklog"][":worklogId"]["$patch"]
>;

export function useUpdateWorklog() {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json, param }) => {
      const response = await client.api.tasks["worklog"][":worklogId"].$patch({
        json,
        param,
      });

      if (!response.ok) {
        throw new Error("Failed to update worklog");
      }
      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Worklog updated");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: () => {
      toast.error("Failed to update worklog");
    },
  });
  return mutation;
}
