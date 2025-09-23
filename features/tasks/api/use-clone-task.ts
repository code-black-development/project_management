import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useCreateTask } from "./use-create-task";
import { TaskType, TaskStatus } from "@prisma/client";
import { client } from "@/lib/rpc";

interface UseCloneTaskOptions {
  redirectOnSuccess?: boolean;
  onSuccess?: () => void;
}

export function useCloneTask(options: UseCloneTaskOptions = {}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { redirectOnSuccess = true, onSuccess } = options;
  
  const createTask = useCreateTask({ 
    redirectOnSuccess: false,
    onSuccess: undefined 
  });

  const mutation = useMutation({
    mutationFn: async ({ taskId }: { taskId: string }) => {
      // First, fetch the original task data using the existing API
      const response = await client.api.tasks[":taskId"].$get({
        param: { taskId }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch task data for cloning");
      }
      
      const { data: originalTask } = await response.json();
      
      // Validate required fields first
      if (!originalTask.workspaceId || !originalTask.projectId) {
        throw new Error("Missing required workspace or project information");
      }

      // Prepare cloned task data with proper validation
      const clonedTaskData = {
        name: `${originalTask.name} (Copy)`,
        status: originalTask.status || TaskStatus.TODO,
        workspaceId: originalTask.workspaceId,
        projectId: originalTask.projectId,
        taskType: originalTask.taskType || TaskType.TASK,
        categoryId: originalTask.categoryId || "",
        timeEstimate: originalTask.timeEstimate || "",
        dueDate: originalTask.dueDate,
        assigneeId: originalTask.assigneeId || "",
        description: originalTask.description || "",
        // For events, include recurrence settings
        isRecurring: originalTask.isRecurring || false,
        recurrenceFrequency: originalTask.recurrenceFrequency || undefined,
        recurrenceDuration: originalTask.recurrenceDuration || undefined,
        recurrenceEndDate: originalTask.recurrenceEndDate || undefined,
      };

      // Create the cloned task
      return createTask.mutateAsync({ json: clonedTaskData });
    },
    onSuccess: (data) => {
      toast.success("Task cloned successfully");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      
      // Call the provided onSuccess callback first
      if (onSuccess) {
        onSuccess();
      }
      
      // Redirect to cloned task detail page
      if (redirectOnSuccess && data?.data) {
        const redirectUrl = `/workspaces/${data.data.workspaceId}/tasks/${data.data.id}`;
        // Small delay to ensure any modals close first
        setTimeout(() => {
          router.push(redirectUrl);
        }, 100);
      }
    },
    onError: (error) => {
      console.error("useCloneTask - Error:", error);
      toast.error(`Failed to clone task: ${error.message}`);
    },
  });

  return {
    ...mutation,
    isPending: mutation.isPending || createTask.isPending,
  };
}