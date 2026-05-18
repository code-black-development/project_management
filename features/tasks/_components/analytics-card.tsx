import { FaCaretUp, FaCaretDown } from "react-icons/fa";
import { cn } from "@/lib/utils";

interface AnalyticsCardProps {
  title: string;
  value: number;
  variant: "up" | "down";
  increaseValue: number;
}

const AnalyticsCard = ({
  title,
  value,
  variant,
  increaseValue,
}: AnalyticsCardProps) => {
  const Icon = variant === "up" ? FaCaretUp : FaCaretDown;
  const trendColor =
    variant === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-red-600 dark:text-red-400";

  return (
    <div className="flex flex-col gap-y-1 px-6 py-4 w-full">
      <span className="text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </span>
      <span className="text-sm text-muted-foreground">{title}</span>
      {increaseValue !== 0 && (
        <div className="flex items-center gap-x-1 mt-0.5">
          <Icon className={cn("size-3", trendColor)} />
          <span className={cn("text-xs font-medium", trendColor)}>
            {Math.abs(increaseValue)}
          </span>
        </div>
      )}
    </div>
  );
};

export default AnalyticsCard;
