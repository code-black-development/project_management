import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";
import { toast } from "sonner";

type ResponseType = InferResponseType<
  (typeof client.api.workspace)[":workspaceId"]["invite"]["$post"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.workspace)[":workspaceId"]["invite"]["$post"]
>;

export function useCreateWorkspaceInvites() {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json, param }) => {
      const response = await client.api.workspace[":workspaceId"][
        "invite"
      ].$post({ json, param });

      if (!response.ok) {
        throw new Error("Failed to create workspace inivtes");
        console.log(response);
      }
      return await response.json();
    },
    onSuccess: () => {
      toast.success("Workspace invites created");
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
    onError: () => {
      toast.error("Failed to create workspace invites");
    },
  });
  return mutation;
}
