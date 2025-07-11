import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface UseGetReportsProps {
  workspaceId: string;
}

export const useGetReports = ({ workspaceId }: UseGetReportsProps) => {
  const query = useQuery({
    queryKey: ["reports", workspaceId],
    queryFn: async () => {
      const response = await client.api.reports[":workspaceId"].$get({
        param: { workspaceId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch reports");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
