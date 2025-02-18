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
import { FolderIcon, ListCheckIcon, UserIcon } from "lucide-react";
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

  const onAssigneeChange = (value: string) => {
    setfilters({ assigneeId: value === "all" ? null : value });
  };

  const onProjectChange = (value: string) => {
    setfilters({ projectId: value === "all" ? null : value });
  };

  if (isLoading) {
    return null;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-2">
      <Select
        defaultValue={status ?? undefined}
        onValueChange={(value) => onStatusChange(value)}
      >
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
      <Select
        defaultValue={assigneeId ?? undefined}
        onValueChange={(value) => onAssigneeChange(value)}
      >
        <SelectTrigger className="w-full lg:w-auto h-8">
          <div className="flex items-center pr-2">
            <UserIcon className="size-4 mr-2" />
            <SelectValue placeholder="All members" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All members</SelectItem>
          <SelectSeparator />
          {memberOptions?.map((member) => (
            <SelectItem key={member.value} value={member.value}>
              {member.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        defaultValue={projectId ?? undefined}
        onValueChange={(value) => onProjectChange(value)}
      >
        <SelectTrigger className="w-full lg:w-auto h-8">
          <div className="flex items-center pr-2">
            <FolderIcon className="size-4 mr-2" />
            <SelectValue placeholder="All projects" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All projects</SelectItem>
          <SelectSeparator />
          {projectOptions?.map((project) => (
            <SelectItem key={project.value} value={project.value}>
              {project.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <DatePicker
        placeholder="Due date"
        className="h-8 w-full lg:w-auto"
        value={dueDate ? new Date(dueDate) : undefined}
        onChange={(date) =>
          setfilters({ dueDate: date ? date.toISOString() : null })
        }
      />
    </div>
  );
};

export default DataFilters;
