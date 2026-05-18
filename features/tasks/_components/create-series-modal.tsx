"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useCreateTaskSeries } from "../api/use-create-task-series";

interface CreateSeriesModalProps {
  taskId: string;
  taskName: string;
  taskDueDate: string | null;
  open: boolean;
  onClose: () => void;
}

const FREQUENCY_LABELS: Record<string, string> = {
  WEEKLY: "Weekly",
  FORTNIGHTLY: "Fortnightly",
  MONTHLY: "Monthly",
};

const CreateSeriesModal = ({
  taskId,
  taskName,
  taskDueDate,
  open,
  onClose,
}: CreateSeriesModalProps) => {
  const [frequency, setFrequency] = useState<"WEEKLY" | "FORTNIGHTLY" | "MONTHLY">("WEEKLY");
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const { mutate: createSeries, isPending } = useCreateTaskSeries();

  const canSubmit = !!endDate && (!taskDueDate || new Date(endDate) > new Date(taskDueDate));

  const handleSubmit = () => {
    if (!endDate) return;
    createSeries(
      { taskId, frequency, endDate: endDate.toISOString() },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md dark:bg-card">
        <DialogHeader>
          <DialogTitle>Create repeated task</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-y-4 py-2">
          <div>
            <p className="text-sm text-muted-foreground">
              Repeating: <span className="font-medium text-foreground">{taskName}</span>
            </p>
            {taskDueDate && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Starting from {format(new Date(taskDueDate), "MMM d, yyyy")}
              </p>
            )}
            {!taskDueDate && (
              <p className="text-xs text-destructive mt-0.5">
                This task needs a due date before a series can be created.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-y-1.5">
            <Label>Repeat every</Label>
            <Select
              value={frequency}
              onValueChange={(v) => setFrequency(v as typeof frequency)}
              disabled={!taskDueDate}
            >
              <SelectTrigger className="dark:bg-card dark:text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-card dark:text-foreground">
                {Object.entries(FREQUENCY_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-y-1.5">
            <Label>End date <span className="text-destructive">*</span></Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={!taskDueDate}
                  className={cn(
                    "justify-start text-left font-normal",
                    !endDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {endDate ? format(endDate, "MMM d, yyyy") : "Pick an end date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 dark:bg-card" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) =>
                    taskDueDate ? date <= new Date(taskDueDate) : false
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex justify-end gap-x-2 pt-2 border-t border-border">
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isPending}>
            {isPending ? "Creating..." : "Create series"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSeriesModal;
