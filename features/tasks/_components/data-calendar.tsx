import {
  format,
  getDay,
  parse,
  startOfWeek,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
} from "date-fns";

import { enUS } from "date-fns/locale";

import { Calendar, dateFnsLocalizer } from "react-big-calendar";

import { useState } from "react";
import { TaskListItem } from "@/types/types";

import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from "lucide-react";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

import "react-big-calendar/lib/css/react-big-calendar.css";
import "./data-calendar.css";
import EventCard from "./event-card";
import { Button } from "@/components/ui/button";
import { useGetEvents } from "../api/use-get-events";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useProjectId } from "@/features/projects/hooks/use-project-id";
import useCreateEventModal from "../hooks/use-create-event-modal";
import useTaskFilters from "../api/use-task-filters";

interface DataCalendarProps {
  data: TaskListItem[];
  hideProjectInfo?: boolean;
}

interface CustomToolbarProps {
  date: Date;
  onNavigate: (action: "PREV" | "NEXT" | "TODAY") => void;
}

const CustomToolbar = ({ date, onNavigate }: CustomToolbarProps) => {
  return (
    <div className="flex mb-4 gap-x-2 justify-center items-center w-full lg:justify-between">
      <div className="flex gap-x-2 items-center">
        <Button
          onClick={() => onNavigate("PREV")}
          variant="secondary"
          size="icon"
          className="flex items-center"
        >
          <ChevronLeftIcon className="size-4" />
        </Button>
        <div className="flex items-center border border-input rounded-md px-3 py-2 h-8 justify-center lg:w-full">
          <CalendarIcon className="size-4 mr-2" />
          <p className="text-sm">{format(date, "MMMM yyyy")}</p>
        </div>

        <Button
          onClick={() => onNavigate("NEXT")}
          variant="secondary"
          size="icon"
          className="flex items-center"
        >
          <ChevronRightIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
};

const DataCalendar = ({ data, hideProjectInfo }: DataCalendarProps) => {
  const workspaceId = useWorkspaceId();
  const paramProjectId = useProjectId();
  const [{ projectId }] = useTaskFilters();
  const { open: openEventModal } = useCreateEventModal();

  // Filter out tasks with null dueDate
  const tasksWithDueDates = data.filter((task) => task.dueDate !== null);

  const [value, setValue] = useState(
    tasksWithDueDates.length > 0
      ? new Date(tasksWithDueDates[0].dueDate!)
      : new Date()
  );

  // Fetch events for the current month
  const monthStart = startOfMonth(value);
  const monthEnd = endOfMonth(value);

  const {
    data: events,
    isLoading: eventsLoading,
    error: eventsError,
  } = useGetEvents({
    workspaceId,
    projectId: paramProjectId || projectId || undefined,
    startDate: monthStart.toISOString(),
    endDate: monthEnd.toISOString(),
  });

  // Combine tasks and events for display
  const taskEvents = tasksWithDueDates.map((task) => ({
    start: new Date(task.dueDate!),
    end: new Date(task.dueDate!),
    title: task.name,
    project: task.project,
    assignee: task.assignee,
    status: task.status,
    id: task.id,
    type: "task" as const,
  }));

  // Ensure events is always an array, even if the API call fails
  const safeEvents = Array.isArray(events) ? events : [];

  const eventEvents = safeEvents.map((event: any) => ({
    start: new Date(event.dueDate!),
    end: new Date(event.dueDate!),
    title: event.name,
    project: event.project,
    assignee: event.assignee,
    status: event.status,
    id: event.id,
    type: "event" as const,
  }));

  const allEvents = [...taskEvents, ...eventEvents];

  const handleNavigate = (action: "PREV" | "NEXT" | "TODAY") => {
    if (action === "PREV") {
      setValue(subMonths(value, 1));
    }
    if (action === "NEXT") {
      setValue(addMonths(value, 1));
    }
    if (action === "TODAY") {
      setValue(new Date());
    }
  };

  return (
    <Calendar
      localizer={localizer}
      events={allEvents}
      date={value}
      views={["month"]}
      defaultView="month"
      toolbar
      showAllEvents
      className="h-full"
      max={new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
      formats={{
        weekdayFormat: (date, culture, localizer) =>
          localizer?.format(date, "EEEE", culture) ?? "",
      }}
      components={{
        eventWrapper: ({ event }) => (
          <EventCard
            id={event.id}
            title={event.title}
            assignee={event.assignee ?? undefined}
            project={event.project}
            status={event.status}
            type={event.type}
            hideProjectInfo={hideProjectInfo}
          />
        ),
        toolbar: () => (
          <CustomToolbar date={value} onNavigate={handleNavigate} />
        ),
      }}
    />
  );
};

export default DataCalendar;
