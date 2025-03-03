import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";
import { toast } from "sonner";

type ResponseType = InferResponseType<
  (typeof client.api.workspace)["$post"],
  200
>;
type RequestType = InferRequestType<(typeof client.api.workspace)["$post"]>;

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ form }) => {
      const response = await client.api.workspace.$post({ form });

      if (!response.ok) {
        throw new Error("Failed to create workspace");
        console.log(response);
      }
      return await response.json();
    },
    onSuccess: () => {
      toast.success("Workspace created");
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
    onError: () => {
      toast.error("Failed to create workspace");
    },
  });
  return mutation;
}
