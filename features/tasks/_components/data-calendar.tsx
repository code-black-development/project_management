import {
  format,
  getDay,
  parse,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
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
          <p className="w-32 text-center text-sm tabular-nums">
            {format(date, "MMMM yyyy")}
          </p>
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

interface MobileWeekViewProps {
  value: Date;
  onPrev: () => void;
  onNext: () => void;
  allEvents: {
    start: Date;
    end: Date;
    title: string;
    project: any;
    assignee: any;
    status: string;
    id: string;
    type: "task" | "event";
  }[];
  hideProjectInfo?: boolean;
}

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const MobileWeekView = ({ value, onPrev, onNext, allEvents, hideProjectInfo }: MobileWeekViewProps) => {
  const weekStart = startOfWeek(value, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(value, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const firstWeekStart = startOfWeek(startOfMonth(value), { weekStartsOn: 0 });
  const weekOfMonth = Math.floor((weekStart.getTime() - firstWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

  const dateRangeLabel =
    format(weekStart, "MMM d") + " – " +
    (weekStart.getMonth() === weekEnd.getMonth()
      ? format(weekEnd, "d, yyyy")
      : format(weekEnd, "MMM d, yyyy"));

  const weekLabel = `${ordinal(weekOfMonth)} week · ${dateRangeLabel}`;

  return (
    <div className="flex flex-col gap-y-3">
      <div className="flex items-center justify-between">
        <Button onClick={onPrev} variant="outline" size="icon" className="shrink-0">
          <ChevronLeftIcon className="size-4" />
        </Button>
        <div className="flex flex-col items-center gap-y-0.5">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {ordinal(weekOfMonth)} week
          </span>
          <span className="text-sm font-semibold tabular-nums">{dateRangeLabel}</span>
        </div>
        <Button onClick={onNext} variant="outline" size="icon" className="shrink-0">
          <ChevronRightIcon className="size-4" />
        </Button>
      </div>
      <div className="flex flex-col gap-y-2">
        {days.map((day) => {
          const dayEvents = allEvents.filter((e) => isSameDay(e.start, day));
          return (
            <div key={day.toISOString()} className="border border-border rounded-lg overflow-hidden">
              <div className={`px-3 py-2 text-sm font-medium ${isToday(day) ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                {format(day, "EEE, MMM d")}
              </div>
              {dayEvents.length > 0 ? (
                <div className="flex flex-col gap-y-1 py-1">
                  {dayEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      id={event.id}
                      title={event.title}
                      assignee={event.assignee ?? undefined}
                      project={event.project}
                      status={event.status}
                      type={event.type}
                      hideProjectInfo={hideProjectInfo}
                    />
                  ))}
                </div>
              ) : (
                <p className="px-3 py-2 text-xs text-muted-foreground">No tasks</p>
              )}
            </div>
          );
        })}
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

  const [value, setValue] = useState(new Date());

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
    if (action === "PREV") setValue(subMonths(value, 1));
    if (action === "NEXT") setValue(addMonths(value, 1));
    if (action === "TODAY") setValue(new Date());
  };

  return (
    <>
      {/* Mobile: weekly view */}
      <div className="block sm:hidden">
        <MobileWeekView
          value={value}
          onPrev={() => setValue(subWeeks(value, 1))}
          onNext={() => setValue(addWeeks(value, 1))}
          allEvents={allEvents}
          hideProjectInfo={hideProjectInfo}
        />
      </div>

      {/* Desktop: month calendar */}
      <div className="hidden sm:block">
        <Calendar
          localizer={localizer}
          events={allEvents}
          date={value}
          views={["month"]}
          defaultView="month"
          toolbar
          showAllEvents
          className="data-calendar h-full"
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
      </div>
    </>
  );
};

export default DataCalendar;
