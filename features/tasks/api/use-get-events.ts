import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface UseGetEventsProps {
  workspaceId: string;
  projectId?: string;
  startDate?: string;
  endDate?: string;
}

export const useGetEvents = ({
  workspaceId,
  projectId,
  startDate,
  endDate,
}: UseGetEventsProps) => {
  const query = useQuery({
    queryKey: ["events", workspaceId, projectId, startDate, endDate],
    queryFn: async () => {
      const queryParams: {
        workspaceId: string;
        projectId?: string;
        startDate?: string;
        endDate?: string;
      } = { workspaceId };

      if (projectId) queryParams.projectId = projectId;
      if (startDate) queryParams.startDate = startDate;
      if (endDate) queryParams.endDate = endDate;

      try {
        const response = await client.api.tasks.events.$get({
          query: queryParams,
        });

        if (!response.ok) {
          console.error("Events API response not ok:", response.status);
          return [];
        }

        const result = await response.json();
        console.log("Events API response:", result);

        // Ensure we always return an array
        return Array.isArray(result.data) ? result.data : [];
      } catch (error) {
        console.error("Failed to fetch events:", error);
        return [];
      }
    },
  });

  return query;
};
