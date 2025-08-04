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

// Type for the invite result data from backend
type InviteResultData = {
  newUserInvites: string[];
  existingUserAdded: string[];
  alreadyMembers: string[];
  errors: { email: string; error: string }[];
};

export function useCreateWorkspaceInvites() {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json, param }) => {
      const response = await client.api.workspace[":workspaceId"][
        "invite"
      ].$post({ json, param });

      if (!response.ok) {
        throw new Error("Failed to create workspace invites");
      }
      return await response.json();
    },
    onSuccess: (data, variables) => {
      const result = data.data as InviteResultData;
      const workspaceId = variables.param.workspaceId;

      // Show success messages for each type of result
      if (result.newUserInvites.length > 0) {
        toast.success(
          `Invitations sent to ${result.newUserInvites.length} new user${result.newUserInvites.length > 1 ? "s" : ""}: ${result.newUserInvites.join(", ")}`
        );
      }

      if (result.existingUserAdded.length > 0) {
        toast.success(
          `${result.existingUserAdded.length} existing user${result.existingUserAdded.length > 1 ? "s" : ""} added to workspace: ${result.existingUserAdded.join(", ")}`
        );
      }

      // Show info messages for users already in workspace
      if (result.alreadyMembers.length > 0) {
        toast.info(
          `${result.alreadyMembers.length} user${result.alreadyMembers.length > 1 ? "s are" : " is"} already a member: ${result.alreadyMembers.join(", ")}`
        );
      }

      // Show error messages for failed invites
      if (result.errors.length > 0) {
        result.errors.forEach(({ email, error }) => {
          toast.error(`Failed to invite ${email}: ${error}`);
        });
      }

      // Show overall success if any invites were processed successfully
      const totalSuccessful =
        result.newUserInvites.length + result.existingUserAdded.length;
      if (totalSuccessful > 0) {
        toast.success(
          `Successfully processed ${totalSuccessful} invite${totalSuccessful > 1 ? "s" : ""}`
        );
      }

      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["workspace-members"] });
    },
    onError: (error) => {
      toast.error(`Failed to process workspace invites: ${error.message}`);
    },
  });
  return mutation;
}
