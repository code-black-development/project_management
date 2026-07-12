import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import {
  SelectItem,
  SelectContent,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  Select,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import DatePicker from "@/components/date-picker";
import {
  ChevronDownIcon,
  FolderIcon,
  ListCheckIcon,
  SearchIcon,
  UserIcon,
  TrashIcon,
} from "lucide-react";
import { TaskStatus } from "@prisma/client";
import useTaskFilters from "../api/use-task-filters";
import { useEffect, useMemo, useState } from "react";
import { snakeCaseToTitleCase } from "@/lib/utils";

interface DataFiltersProps {
  hideProjectFilter?: boolean;
  hideAssigneeFilter?: boolean;
}

const STATUS_OPTIONS = Object.values(TaskStatus) as TaskStatus[];

const DataFilters = ({ hideProjectFilter, hideAssigneeFilter }: DataFiltersProps) => {
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
    label: member.user.name || member.user.email,
    value: member.id,
  }));

  const [{ statuses, assigneeId, projectId, dueDate, search }, setfilters] =
    useTaskFilters();

  const [searchInput, setSearchInput] = useState(search || "");

  useEffect(() => {
    setSearchInput(search || "");
  }, [search]);

  const selectedStatusesLabel = useMemo(() => {
    if (statuses.length === 0) {
      return "All statuses";
    }

    if (statuses.length <= 2) {
      return statuses.map((status) => snakeCaseToTitleCase(status)).join(", ");
    }

    return `${statuses.length} statuses`;
  }, [statuses]);

  const onStatusCheckedChange = (value: TaskStatus, checked: boolean) => {
    const nextStatusSet = new Set(statuses);

    if (checked) {
      nextStatusSet.add(value);
    } else {
      nextStatusSet.delete(value);
    }

    const nextStatuses = STATUS_OPTIONS.filter((status) =>
      nextStatusSet.has(status)
    );

    setfilters({
      status: nextStatuses.length > 0 ? nextStatuses.join(",") : null,
    });
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
    statuses.length > 0 ||
      (!hideAssigneeFilter && assigneeId) ||
      (!hideProjectFilter && projectId) ||
      dueDate ||
      search
  );

  const onClearFilters = () => {
    setfilters({
      status: null,
      assigneeId: hideAssigneeFilter ? assigneeId : null,
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
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
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
          variant="muted"
        >
          Search
        </Button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="muted"
            className="h-8 w-full lg:w-auto justify-between"
          >
            <span className="flex min-w-0 items-center">
              <ListCheckIcon className="mr-2 size-4 shrink-0" />
              <span className="truncate">{selectedStatusesLabel}</span>
            </span>
            <ChevronDownIcon className="ml-2 size-4 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {STATUS_OPTIONS.map((status) => (
            <DropdownMenuCheckboxItem
              key={status}
              checked={statuses.includes(status)}
              onCheckedChange={(checked) =>
                onStatusCheckedChange(status, checked === true)
              }
              onSelect={(event) => event.preventDefault()}
            >
              {snakeCaseToTitleCase(status)}
            </DropdownMenuCheckboxItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={statuses.length === 0}
            onSelect={() => setfilters({ status: null })}
          >
            Clear status filter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {!hideAssigneeFilter && (
        <Select
          value={assigneeId ?? "all"}
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
      )}
      {!hideProjectFilter && (
        <Select
          value={projectId ?? "all"}
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
