"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface DeleteTaskSeriesRequest {
  seriesId: string;
  scope: "all" | "upcoming";
  fromTaskId?: string;
}

export const useDeleteTaskSeries = () => {
  const queryClient = useQueryClient();

  return useMutation<{ data: { deleted: number } }, Error, DeleteTaskSeriesRequest>({
    mutationFn: async ({ seriesId, scope, fromTaskId }) => {
      const params = new URLSearchParams({ scope });
      if (fromTaskId) params.set("fromTaskId", fromTaskId);
      const response = await fetch(
        `/api/tasks/series/${seriesId}?${params}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to archive series");
      }

      return response.json();
    },
    onSuccess: (data, { scope }) => {
      const label =
        scope === "all"
          ? "All series tasks archived"
          : "Upcoming series tasks archived";
      toast.success(`${label} (${data.data.deleted} archived)`);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to archive series");
    },
  });
};
