import { TaskPriority, TaskStatus } from "@prisma/client";
import { useUrlQuerySetter } from "@/hooks/use-url-query-state";
import { useSearchParams } from "next/navigation";

type TaskFilterState = {
  projectId: string | null;
  statuses: TaskStatus[];
  priorities: TaskPriority[];
  assigneeId: string | null;
  search: string | null;
  dueDate: string | null;
};

const TASK_STATUSES = Object.values(TaskStatus) as TaskStatus[];
const TASK_PRIORITIES = Object.values(TaskPriority) as TaskPriority[];

const parseStatuses = (rawStatus: string | null) => {
  if (!rawStatus) {
    return [];
  }

  const selectedStatuses = new Set(
    rawStatus
      .split(",")
      .map((value) => value.trim())
      .filter((value): value is TaskStatus =>
        TASK_STATUSES.includes(value as TaskStatus)
      )
  );

  return TASK_STATUSES.filter((status) => selectedStatuses.has(status));
};

const parsePriorities = (rawPriority: string | null) => {
  if (!rawPriority) {
    return [];
  }

  const selected = new Set(
    rawPriority
      .split(",")
      .map((value) => value.trim())
      .filter((value): value is TaskPriority =>
        TASK_PRIORITIES.includes(value as TaskPriority)
      )
  );

  return TASK_PRIORITIES.filter((priority) => selected.has(priority));
};

const useTaskFilters = () => {
  const searchParams = useSearchParams();
  const setFilters = useUrlQuerySetter({ history: "push" });
  const statuses = parseStatuses(searchParams.get("status"));
  const priorities = parsePriorities(searchParams.get("priority"));

  return [
    {
      projectId: searchParams.get("projectId"),
      statuses,
      priorities,
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
