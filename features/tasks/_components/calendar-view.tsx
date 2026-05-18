"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetEvents } from "../api/use-get-events";
import useCreateEventModal from "../hooks/use-create-event-modal";
import { TaskWithUser } from "@/types/types";

interface CalendarViewProps {
  projectId?: string;
}

const CalendarView = ({ projectId }: CalendarViewProps) => {
  const workspaceId = useWorkspaceId();
  const { open: openEventModal } = useCreateEventModal();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get the start and end of the current month for fetching events
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const { data: events, isLoading } = useGetEvents({
    workspaceId,
    projectId,
    startDate: monthStart.toISOString(),
    endDate: monthEnd.toISOString(),
  });

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const getEventsForDate = (date: Date) => {
    if (!events) return [];
    return events.filter(
      (event: any) => event.dueDate && isSameDay(new Date(event.dueDate), date),
    );
  };

  const getDaysInMonth = () => {
    return eachDayOfInterval({
      start: monthStart,
      end: monthEnd,
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Event Calendar - {format(currentDate, "MMMM yyyy")}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={openEventModal}>
              <Plus className="size-4 mr-2" />
              New Event
            </Button>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-2 text-center font-medium text-sm text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {getDaysInMonth().map((date) => {
            const dayEvents = getEventsForDate(date);
            const isToday = isSameDay(date, new Date());

            return (
              <div
                key={date.toISOString()}
                className={`
                  min-h-24 p-2 border rounded-lg
                  ${isToday ? "bg-primary/5 border-primary" : "border-border"}
                  hover:bg-muted/50 transition-colors
                `}
              >
                <div
                  className={`text-sm font-medium mb-1 ${isToday ? "text-primary" : ""}`}
                >
                  {format(date, "d")}
                </div>

                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event: any) => (
                    <Badge
                      key={event.id}
                      variant="secondary"
                      className="text-xs block truncate"
                      title={event.name}
                    >
                      {event.name}
                    </Badge>
                  ))}
                  {dayEvents.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{dayEvents.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {events && events.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No events scheduled for this month
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarView;
