"use client";

import { AlertTriangleIcon } from "lucide-react";
import { isBefore, startOfDay } from "date-fns";

interface PastDateWarningProps {
  date?: Date | string | null;
  message?: string;
  className?: string;
}

const PastDateWarning = ({
  date,
  message = "This date is in the past.",
  className,
}: PastDateWarningProps) => {
  if (!date) {
    return null;
  }

  const resolvedDate = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(resolvedDate.getTime())) {
    return null;
  }

  if (!isBefore(startOfDay(resolvedDate), startOfDay(new Date()))) {
    return null;
  }

  return (
    <p
      className={[
        "flex items-start gap-x-2 text-[0.8rem] text-amber-700 dark:text-amber-400",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0" />
      <span>{message}</span>
    </p>
  );
};

export default PastDateWarning;
