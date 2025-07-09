import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type ResponseType = InferResponseType<
  (typeof client.api.tasks.assets)["$post"],
  200
>;
type RequestType = InferRequestType<(typeof client.api.tasks.assets)["$post"]>;

export function useCreateAssets() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (formData) => {
      const response = await client.api.tasks.assets.$post({ form: formData });

      if (!response.ok) {
        throw new Error("Failed to create assets");
      }
      return await response.json();
    },
    onSuccess: ({ data }) => {
      console.log(data);
      toast.success("Assets created");
      queryClient.invalidateQueries({ queryKey: ["tasks", data] });
    },
    onError: () => {
      toast.error("Failed to create assets");
    },
  });
  return mutation;
}
