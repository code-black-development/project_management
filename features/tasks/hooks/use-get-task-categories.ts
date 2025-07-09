import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

export const useGetTaskCategories = () => {
  const query = useQuery({
    queryKey: ["task-categories"],
    queryFn: async () => {
      const response = await client.api.tasks.categories.$get();

      if (!response.ok) {
        throw new Error("Failed to fetch task categories");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
