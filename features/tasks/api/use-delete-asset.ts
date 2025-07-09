import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type ResponseType = InferResponseType<
  (typeof client.api.tasks.assets)[":assetId"]["$delete"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.tasks.assets)[":assetId"]["$delete"]
>;

export function useDeleteAsset() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param }) => {
      const response = await client.api.tasks.assets[":assetId"].$delete({
        param,
      });

      if (!response.ok) {
        throw new Error("Failed to delete asset");
      }
      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("asset deleted");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", data.id] });
    },
    onError: () => {
      toast.error("Failed to delete asset");
    },
  });
  return mutation;
}
