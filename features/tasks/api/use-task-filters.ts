import { TaskStatus } from "@prisma/client";
import { parseAsString, parseAsStringEnum, useQueryStates } from "nuqs";

const useTaskFilters = () => {
  return useQueryStates({
    projectId: parseAsString,
    status: parseAsStringEnum(Object.values(TaskStatus)),
    assigneeId: parseAsString,
    search: parseAsString,
    dueDate: parseAsString,
  });
};
export default useTaskFilters;
