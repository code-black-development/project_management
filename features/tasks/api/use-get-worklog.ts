import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface UseGetWorklogProps {
  worklogId: string;
}

export const useGetWorklog = ({ worklogId }: UseGetWorklogProps) => {
  return useQuery({
    queryKey: ["worklog", worklogId],
    queryFn: async () => {
      const response = await client.api.tasks["worklog"][":worklogId"].$get({
        param: { worklogId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch worklog");
      }
      const { data } = await response.json();
      return data;
    },
    enabled: !!worklogId,
  });
};
