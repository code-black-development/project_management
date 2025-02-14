import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type ResponseType = InferResponseType<
  (typeof client.api.projects)["$post"],
  200
>;
type RequestType = InferRequestType<(typeof client.api.projects)["$post"]>;

export function useCreateProject() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ form }) => {
      const response = await client.api.projects.$post({ form });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }
      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Project created");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push(`/workspaces/${data.workspaceId}/project/${data.id}`);
    },
    onError: () => {
      toast.error("Failed to create project");
    },
  });
  return mutation;
}
