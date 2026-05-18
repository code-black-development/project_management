import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TaskStatus } from "@prisma/client";
import { toast } from "sonner";

interface BulkStatusUpdateRequest {
  ids: string[];
  status: TaskStatus;
}

export function useBulkStatusUpdateTasks() {
  const queryClient = useQueryClient();

  return useMutation<{ data: { ids: string[]; status: TaskStatus } }, Error, BulkStatusUpdateRequest>({
    mutationFn: async ({ ids, status }) => {
      const response = await fetch("/api/tasks/bulk-status-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, status }),
      });
      if (!response.ok) throw new Error("Failed to update tasks");
      return response.json();
    },
    onSuccess: ({ data }) => {
      toast.success(`${data.ids.length} task${data.ids.length === 1 ? "" : "s"} updated`);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: () => {
      toast.error("Failed to update tasks");
    },
  });
}
