import { TaskStatus } from "@prisma/client";
import { useUrlQuerySetter } from "@/hooks/use-url-query-state";
import { useSearchParams } from "next/navigation";

type TaskFilterState = {
  projectId: string | null;
  status: TaskStatus | null;
  assigneeId: string | null;
  search: string | null;
  dueDate: string | null;
};

const useTaskFilters = () => {
  const searchParams = useSearchParams();
  const setFilters = useUrlQuerySetter();
  const rawStatus = searchParams.get("status");
  const status = Object.values(TaskStatus).includes(rawStatus as TaskStatus)
    ? (rawStatus as TaskStatus)
    : null;

  return [
    {
      projectId: searchParams.get("projectId"),
      status,
      assigneeId: searchParams.get("assigneeId"),
      search: searchParams.get("search"),
      dueDate: searchParams.get("dueDate"),
    },
    setFilters,
  ] as const satisfies readonly [
    TaskFilterState,
    ReturnType<typeof useUrlQuerySetter>,
  ];
};
export default useTaskFilters;
