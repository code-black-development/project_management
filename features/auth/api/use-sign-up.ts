import { useMutation } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
  (typeof client.api.users.register)["$post"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.users.register)["$post"]
>;

export function useSignUp() {
  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.users.register.$post({
        json,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message =
          (body as { error?: string } | null)?.error ?? "Failed to register user";
        throw new Error(message);
      }
      return await response.json();
    },
  });
  return mutation;
}
