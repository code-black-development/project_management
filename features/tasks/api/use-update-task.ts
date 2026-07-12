import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";
import { toast } from "sonner";
import { TaskWithUser } from "@/types/types";

type ResponseType = InferResponseType<
  (typeof client.api.tasks)[":taskId"]["$patch"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.tasks)[":taskId"]["$patch"]
>;

const normalizeTaskPatch = (json: RequestType["json"]) => {
  const normalized: Partial<TaskWithUser> = {};

  if (json.name !== undefined) normalized.name = json.name;
  if (json.status !== undefined) normalized.status = json.status;
  if (json.description !== undefined) normalized.description = json.description;
  if (json.timeEstimate !== undefined) normalized.timeEstimate = json.timeEstimate;

  if (json.dueDate !== undefined) {
    normalized.dueDate =
      json.dueDate instanceof Date
        ? json.dueDate.toISOString()
        : json.dueDate;
  }

  if (json.assigneeId !== undefined) {
    normalized.assigneeId = json.assigneeId;
  }

  if (json.categoryId !== undefined) {
    normalized.categoryId = json.categoryId;
  }

  if (json.projectId !== undefined) {
    normalized.projectId = json.projectId;
  }

  return normalized;
};

export function useUpdateTask() {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json, param }) => {
      const response = await client.api.tasks[":taskId"].$patch({
        json,
        param,
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }
      return await response.json();
    },
    onSuccess: async (_response, variables) => {
      toast.success("task updated");
      const taskId = variables.param.taskId;
      const patch = normalizeTaskPatch(variables.json);

      queryClient.setQueryData(
        ["tasks", taskId],
        (current: TaskWithUser | undefined) => {
          if (!current) {
            return current;
          }

          const nextTask: TaskWithUser = {
            ...current,
            ...patch,
          };

          if (patch.assigneeId !== undefined) {
            nextTask.assignee =
              patch.assigneeId === null
                ? null
                : current.assignee?.id === patch.assigneeId
                  ? current.assignee
                  : null;
          }

          if (patch.categoryId !== undefined) {
            nextTask.category =
              patch.categoryId === null
                ? null
                : current.category?.id === patch.categoryId
                  ? current.category
                  : null;
          }
          return nextTask;
        }
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tasks"] }),
        queryClient.refetchQueries({ queryKey: ["tasks", taskId], exact: true }),
      ]);
    },
    onError: () => {
      toast.error("Failed to update task");
    },
  });
  return mutation;
}
