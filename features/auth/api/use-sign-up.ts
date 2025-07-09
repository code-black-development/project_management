import { useMutation, useQueryClient } from "@tanstack/react-query";
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
        throw new Error("Failed to register user");
      }
      return await response.json();
    },
    //onSuccess: ({ data }) => {},
  });
  return mutation;
}
