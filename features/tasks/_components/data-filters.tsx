import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectItem,
  SelectSeparator,
  SelectValue,
} from "@/components/ui/select";

import DatePicker from "@/components/date-picker";
import { ListCheckIcon } from "lucide-react";
import { TaskStatus } from "@prisma/client";
import useTaskFilters from "../api/use-task-filters";

interface DataFiltersProps {
  hideProjectFilter?: boolean;
}

const DataFilters = ({ hideProjectFilter }: DataFiltersProps) => {
  const workspaceId = useWorkspaceId();
  const { data: projects, isLoading: isLoadingProjects } = useGetProjects({
    workspaceId,
  });
  const { data: members, isLoading: isLoadingMembers } = useGetMembers({
    workspaceId,
  });

  const isLoading = isLoadingProjects || isLoadingMembers;

  const projectOptions = projects?.map((project) => ({
    label: project.name,
    value: project.id,
  }));

  const memberOptions = members?.data.map((member) => ({
    label: member.user.name,
    value: member.id,
  }));

  const [{ status, assigneeId, projectId, dueDate }, setfilters] =
    useTaskFilters();

  const onStatusChange = (value: string) => {
    setfilters({ status: value === "all" ? null : (value as TaskStatus) });
  };

  if (isLoading) {
    return null;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-2">
      <Select defaultValue={status ?? undefined} onValueChange={() => {}}>
        <SelectTrigger className="w-full lg:w-auto h-8">
          <div className="flex items-center pr-2">
            <ListCheckIcon className="size-4 mr-2" />
            <SelectValue placeholder="All statuses" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectSeparator />
          <SelectItem value={TaskStatus.BACKLOG}>Backlog</SelectItem>
          <SelectSeparator />
          <SelectItem value={TaskStatus.TODO}>Todo</SelectItem>
          <SelectSeparator />
          <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
          <SelectSeparator />
          <SelectItem value={TaskStatus.IN_REVIEW}>In Review</SelectItem>
          <SelectSeparator />
          <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default DataFilters;
