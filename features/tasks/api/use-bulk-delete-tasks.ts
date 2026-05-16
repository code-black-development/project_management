import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";
import { toast } from "sonner";

type ResponseType = InferResponseType<
  (typeof client.api.tasks)["bulk-delete"]["$post"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.tasks)["bulk-delete"]["$post"]
>;

export function useBulkDeleteTasks() {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.tasks["bulk-delete"].$post({ json });
      if (!response.ok) throw new Error("Failed to delete tasks");
      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success(`${data.ids.length} task${data.ids.length === 1 ? "" : "s"} deleted`);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: () => {
      toast.error("Failed to delete tasks");
    },
  });
  return mutation;
}
