import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface UseGetDocumentsProps {
  workspaceId?: string | null;
}

export const useGetDocuments = ({ workspaceId }: UseGetDocumentsProps) => {
  const query = useQuery({
    queryKey: ["documents", workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const response = await client.api.documents.$get({
        query: { workspaceId: workspaceId! },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
