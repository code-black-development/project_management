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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import DatePicker from "@/components/date-picker";
import { FolderIcon, ListCheckIcon, SearchIcon, UserIcon, TrashIcon } from "lucide-react";
import { TaskStatus } from "@prisma/client";
import useTaskFilters from "../api/use-task-filters";
import { useState } from "react";

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

  const [{ status, assigneeId, projectId, dueDate, search }, setfilters] =
    useTaskFilters();

  const [searchInput, setSearchInput] = useState(search || "");

  const onStatusChange = (value: string) => {
    setfilters({ status: value === "all" ? null : (value as TaskStatus) });
  };

  const onAssigneeChange = (value: string) => {
    setfilters({ assigneeId: value === "all" ? null : value });
  };

  const onProjectChange = (value: string) => {
    setfilters({ projectId: value === "all" ? null : value });
  };

  const onSearchSubmit = () => {
    setfilters({ search: searchInput.trim() || null });
  };

  const onSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearchSubmit();
    }
  };

  const hasActiveFilters = Boolean(
    status || assigneeId || (!hideProjectFilter && projectId) || dueDate || search
  );

  const onClearFilters = () => {
    setfilters({
      status: null,
      assigneeId: null,
      projectId: null,
      dueDate: null,
      search: null,
    });
    setSearchInput("");
  };

  if (isLoading) {
    return null;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-2">
      {/* Search Input */}
      <div className="flex gap-1 w-full lg:w-auto">
        <div className="relative flex-1 lg:w-[200px]">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
          <Input
            placeholder="Search tasks..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={onSearchKeyPress}
            className="h-8 pl-10"
          />
        </div>
        <Button
          size="sm"
          onClick={onSearchSubmit}
          className="h-8 px-3"
          variant="primary"
        >
          Search
        </Button>
      </div>

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
      {!hideProjectFilter && (
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
      )}
      <DatePicker
        placeholder="Due date"
        className="h-8 w-full lg:w-auto"
        value={dueDate ? new Date(dueDate) : undefined}
        onChange={(date) =>
          setfilters({ dueDate: date ? date.toISOString() : null })
        }
      />
      
      {/* Clear Filters Button */}
      <Button
        size="sm"
        variant="ghost"
        onClick={onClearFilters}
        disabled={!hasActiveFilters}
        className="h-8 px-3"
        title="Clear all filters"
      >
        <TrashIcon className="size-4" />
      </Button>
    </div>
  );
};

export default DataFilters;
