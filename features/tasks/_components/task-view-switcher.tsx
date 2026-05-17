"use client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  PlusIcon,
  ChevronDownIcon,
  CalendarIcon,
  CheckSquareIcon,
} from "lucide-react";
import useCreateTaskModal from "../hooks/use-create-task-modal";
import useCreateEventModal from "../hooks/use-create-event-modal";
import { useGetTasks } from "../api/use-get-tasks";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useQueryState } from "nuqs";
import DataFilters from "./data-filters";
import useTaskFilters from "../api/use-task-filters";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import DataKanban from "./data-kanban";
import { useCallback } from "react";
import { TaskStatus } from "@prisma/client";
import { useBulkUpdateTasks } from "../api/use-bulk-update-task";
import { useBulkDeleteTasks } from "../api/use-bulk-delete-tasks";
import DataCalendar from "./data-calendar";
import { useProjectId } from "@/features/projects/hooks/use-project-id";
import { useProjectAutoHide } from "@/features/projects/hooks/use-project-auto-hide";

interface TaskViewSwitcherProps {
  hideProjectFilter?: boolean;
}

const TaskViewSwitcher = ({ hideProjectFilter }: TaskViewSwitcherProps) => {
  const [{ status, assigneeId, projectId, dueDate, search }] = useTaskFilters();
  const { mutate: bulkUpdate } = useBulkUpdateTasks();
  const { mutate: bulkDelete } = useBulkDeleteTasks();
  const [view, setView] = useQueryState("task-view", { defaultValue: "table" });
  const workspaceId = useWorkspaceId();
  const paramProjectId = useProjectId();
  const { autoHideCompletedTasks, autoHideChildTasks } = useProjectAutoHide(
    paramProjectId || projectId || undefined
  );
  const { data: tasks, isLoading: isLoadingTasks } = useGetTasks({
    workspaceId,
    status,
    assigneeId,
    projectId: paramProjectId || projectId,
    dueDate,
    search,
  });

  const onKanbanChange = useCallback(
    (tasks: { id: string; status: TaskStatus; position: number }[]) => {
      bulkUpdate({ json: { tasks } });
    },
    [bulkUpdate]
  );

  const { open } = useCreateTaskModal();
  const { open: openEvent } = useCreateEventModal();
  return (
    <Tabs
      defaultValue={view}
      onValueChange={setView}
      className="flex-1 w-full border border-border rounded-lg bg-card dark:bg-card"
    >
      <div className="h-full flex flex-col overflow-auto p-4">
        <div className="flex flex-col gap-y-2 lg:flex-row justify-between items-center ">
          <TabsList className="w-full lg:w-auto">
            <TabsTrigger className="h-8 w-full lg:w-auto" value="table">
              Table
            </TabsTrigger>
            <TabsTrigger className="h-8 w-full lg:w-auto" value="kanban">
              Kanban
            </TabsTrigger>
            <TabsTrigger className="h-8 w-full lg:w-auto" value="calendar">
              Calendar
            </TabsTrigger>
          </TabsList>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="w-full lg:w-auto">
                <PlusIcon className="size-4 mr-2" />
                New
                <ChevronDownIcon className="size-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={open}>
                <CheckSquareIcon className="size-4 mr-2" />
                New Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={openEvent}>
                <CalendarIcon className="size-4 mr-2" />
                New Event
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="border-b border-border my-4" />
        <DataFilters hideProjectFilter={hideProjectFilter} />
        <div className="border-b border-border my-4" />
        {(autoHideCompletedTasks || autoHideChildTasks) && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-4">
              {autoHideCompletedTasks && (
                <p className="text-sm text-muted-foreground">Hide done: on</p>
              )}
              {autoHideChildTasks && (
                <p className="text-sm text-muted-foreground">
                  Hide child tasks: on
                </p>
              )}
            </div>
          </div>
        )}
        {isLoadingTasks ? (
          <div className="w-full border rounded-lg h-[200px] flex flex-col items-center justify-center">
            <Loader2 className="animate-spin" />{" "}
          </div>
        ) : (
          <>
            <TabsContent value="table" className="mt-0">
              <DataTable
                columns={columns}
                data={tasks ?? []}
                onDeleteSelected={(ids) => bulkDelete({ json: { ids } })}
              />
            </TabsContent>
            <TabsContent value="kanban" className="mt-0">
              <DataKanban data={tasks ?? []} onChange={onKanbanChange} />
            </TabsContent>
            <TabsContent value="calendar" className="mt-0 h-full pb-4">
              <DataCalendar data={tasks ?? []} hideProjectInfo={hideProjectFilter} />
            </TabsContent>
          </>
        )}
      </div>
    </Tabs>
  );
};

export default TaskViewSwitcher;
