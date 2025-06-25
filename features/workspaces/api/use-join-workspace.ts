/* import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";
import { toast } from "sonner";

type ResponseType = InferResponseType<
  (typeof client.api.workspace)[":workspaceId"]["join"]["$post"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.workspace)[":workspaceId"]["join"]["$post"]
>;

export function useJoinWorkspace() {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json, param }) => {
      const response = await client.api.workspace[":workspaceId"]["join"].$post(
        {
          json,
          param,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to join workspace");
      }
      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Congratulations! You have joined the workspace");
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({
        queryKey: ["workspace", data.workspaceId],
      });
    },
    onError: () => {
      toast.error("Failed to join workspace");
    },
  });
  return mutation;
}
 */
