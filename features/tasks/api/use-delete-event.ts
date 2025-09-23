import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
  (typeof client.api.tasks.events)[":eventId"]["$delete"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.tasks.events)[":eventId"]["$delete"]
>;

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param }) => {
      const response = await client.api.tasks.events[":eventId"]["$delete"]({
        param,
      });

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Event and all occurrences deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: () => {
      toast.error("Failed to delete event");
    },
  });

  return mutation;
};
