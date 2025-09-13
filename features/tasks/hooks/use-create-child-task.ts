import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TaskStatus } from "@prisma/client";
import { client } from "@/lib/rpc";

interface CreateChildTaskParams {
  parentTaskId: string;
  taskData: {
    name: string;
    status: TaskStatus;
    workspaceId: string;
    projectId: string;
    dueDate?: Date | null;
    assigneeId?: string | null;
    description?: string | null;
    timeEstimate?: string | null;
    categoryId?: string | null;
  };
}

export const useCreateChildTask = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ parentTaskId, taskData }: CreateChildTaskParams) => {
      // First create the task using the API directly
      const createResponse = await client.api.tasks.$post({ 
        json: taskData 
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.text();
        throw new Error(`Failed to create task: ${createResponse.status} - ${errorData}`);
      }

      const createdTaskResult = await createResponse.json();
      const taskId = createdTaskResult.data.id;

      // Then link it as a child using the API directly
      const linkResponse = await client.api.tasks.children.$post({
        json: { parentTask: parentTaskId, childTask: taskId }
      });

      if (!linkResponse.ok) {
        const errorData = await linkResponse.text();
        throw new Error(`Failed to link task: ${linkResponse.status} - ${errorData}`);
      }

      const linkResult = await linkResponse.json();
      return { task: createdTaskResult.data, link: linkResult };
    },
    onSuccess: () => {
      toast.success("Child task created successfully");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error) => {
      console.error("Failed to create child task:", error);
      toast.error(`Failed to create child task: ${error.message}`);
    },
  });

  return mutation;
};
