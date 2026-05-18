import { cn } from "@/lib/utils";
import { differenceInDays, format } from "date-fns";

interface TaskDateProps {
  value: string;
  className?: string;
}

const TaskDate = ({ value, className }: TaskDateProps) => {
  const today = new Date();
  const endDate = new Date(value);
  const diffInDays = differenceInDays(endDate, today);

  let textColor = "text-muted-foreground";

  if (diffInDays <= 3) {
    textColor = "text-red-600 dark:text-red-400";
  } else if (diffInDays <= 7) {
    textColor = "text-orange-600 dark:text-orange-400";
  } else if (diffInDays <= 14) {
    textColor = "text-yellow-600 dark:text-yellow-400";
  }

  return (
    <div className={textColor}>
      <span className={cn("truncate", className)}>{format(value, "MMM d, yyyy")}</span>
    </div>
  );
};

export default TaskDate;
