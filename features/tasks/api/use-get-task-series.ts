"use client";

import { useQuery } from "@tanstack/react-query";
import { TaskStatus } from "@prisma/client";

export interface SeriesTask {
  id: string;
  name: string;
  dueDate: string | null;
  status: TaskStatus;
}

export const useGetTaskSeries = (seriesId: string | null | undefined) => {
  return useQuery({
    queryKey: ["task-series", seriesId],
    enabled: !!seriesId,
    queryFn: async (): Promise<SeriesTask[]> => {
      const res = await fetch(`/api/tasks/series/${seriesId}`);
      if (!res.ok) throw new Error("Failed to fetch series");
      const json = await res.json();
      return json.data;
    },
  });
};
