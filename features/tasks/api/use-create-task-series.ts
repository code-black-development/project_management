"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface CreateTaskSeriesRequest {
  taskId: string;
  frequency: "WEEKLY" | "FORTNIGHTLY" | "MONTHLY";
  endDate: string;
}

interface CreateTaskSeriesResponse {
  data: { seriesId: string; count: number };
}

export const useCreateTaskSeries = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateTaskSeriesResponse, Error, CreateTaskSeriesRequest>({
    mutationFn: async ({ taskId, frequency, endDate }) => {
      const response = await fetch(`/api/tasks/${taskId}/series`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frequency, endDate }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create task series");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`Series created — ${data.data.count} repeat${data.data.count === 1 ? "" : "s"} added`);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create task series");
    },
  });
};
