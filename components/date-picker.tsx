import React from "react";
import { format, startOfDay } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
interface DatePickerProps {
  value: Date | undefined;
  onChange: (date: Date) => void;
  className?: string;
  placeholder?: string;
  disablePastDates?: boolean;
  onClear?: () => void;
}

const DatePicker = ({
  value,
  onChange,
  className,
  placeholder,
  disablePastDates = false,
  onClear,
}: DatePickerProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal px-3",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "MMM d, yyyy") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            if (!date) {
              return;
            }

            onChange(date);
            setOpen(false);
          }}
          disabled={
            disablePastDates
              ? (day) => day < startOfDay(new Date())
              : undefined
          }
        />
        {onClear && value && (
          <div className="border-t border-border p-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="w-full justify-center"
              onClick={() => {
                onClear();
                setOpen(false);
              }}
            >
              Clear date
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default DatePicker;
