"use client";
import dynamic from "next/dynamic";
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
import { useUrlStringParam } from "@/hooks/use-url-query-state";
import DataFilters from "./data-filters";
import useTaskFilters from "../api/use-task-filters";
import { useCallback } from "react";
import type { TaskStatus } from "@prisma/client";
import { useBulkUpdateTasks } from "../api/use-bulk-update-task";
import { useBulkDeleteTasks } from "../api/use-bulk-delete-tasks";
import { useProjectId } from "@/features/projects/hooks/use-project-id";
import { useProjectAutoHide } from "@/features/projects/hooks/use-project-auto-hide";
import * as Tooltip from "@radix-ui/react-tooltip";

const TaskTableView = dynamic(() => import("./task-table-view"), {
  ssr: false,
  loading: () => <TaskViewLoading />,
});

const TaskKanbanView = dynamic(() => import("./task-kanban-view"), {
  ssr: false,
  loading: () => <TaskViewLoading />,
});

const DataCalendar = dynamic(() => import("./data-calendar"), {
  ssr: false,
  loading: () => <TaskViewLoading />,
});

interface TaskViewSwitcherProps {
  hideProjectFilter?: boolean;
}

const TaskViewSwitcher = ({ hideProjectFilter }: TaskViewSwitcherProps) => {
  const [{ status, assigneeId, projectId, dueDate, search }] = useTaskFilters();
  const { mutate: bulkUpdate } = useBulkUpdateTasks();
  const { mutate: bulkDelete } = useBulkDeleteTasks();
  const [view, setView] = useUrlStringParam("task-view", "table");
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
      value={view ?? "table"}
      onValueChange={setView}
      className="flex-1 w-full border border-border rounded-lg bg-card dark:bg-card"
    >
      <div className="h-full flex flex-col overflow-auto p-4">
        <Tooltip.Provider delayDuration={300}>
          <div className="flex flex-wrap gap-2 justify-between items-center">
            <div className="flex flex-wrap gap-x-6 gap-y-2 items-center">
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
              {autoHideCompletedTasks && (
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <p className="text-sm text-muted-foreground cursor-default">Hide done: on</p>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="rounded-md bg-popover text-popover-foreground border border-border px-3 py-1.5 text-xs shadow-md"
                      sideOffset={4}
                    >
                      Can be changed in project settings
                      <Tooltip.Arrow className="fill-popover" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              )}
              {autoHideChildTasks && (
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <p className="text-sm text-muted-foreground cursor-default">Hide child tasks: on</p>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="rounded-md bg-popover text-popover-foreground border border-border px-3 py-1.5 text-xs shadow-md"
                      sideOffset={4}
                    >
                      Can be changed in project settings
                      <Tooltip.Arrow className="fill-popover" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              )}
            </div>
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
        </Tooltip.Provider>
        <div className="border-b border-border my-4" />
        <DataFilters hideProjectFilter={hideProjectFilter} />
        <div className="border-b border-border my-4" />
        {isLoadingTasks ? (
          <div className="w-full border rounded-lg h-[200px] flex flex-col items-center justify-center">
            <Loader2 className="animate-spin" />{" "}
          </div>
        ) : (
          <>
            <TabsContent value="table" className="mt-0">
              <TaskTableView
                tasks={tasks ?? []}
                onDeleteSelected={(ids) => bulkDelete({ json: { ids } })}
                hideProjectColumn={hideProjectFilter}
              />
            </TabsContent>
            <TabsContent value="kanban" className="mt-0">
              <TaskKanbanView tasks={tasks ?? []} onChange={onKanbanChange} />
            </TabsContent>
            <TabsContent value="calendar" className="mt-0 h-full pb-4">
              <DataCalendar
                data={tasks ?? []}
                hideProjectInfo={hideProjectFilter}
              />
            </TabsContent>
          </>
        )}
      </div>
    </Tabs>
  );
};

const TaskViewLoading = () => (
  <div className="w-full border rounded-lg h-[200px] flex flex-col items-center justify-center">
    <Loader2 className="animate-spin" />
  </div>
);

export default TaskViewSwitcher;
