import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface UseGetDocumentsProps {
  workspaceId: string;
}

export const useGetDocuments = ({ workspaceId }: UseGetDocumentsProps) => {
  const query = useQuery({
    queryKey: ["documents", workspaceId],
    queryFn: async () => {
      const response = await client.api.documents.$get({
        query: { workspaceId },
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
