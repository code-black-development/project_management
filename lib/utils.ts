import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateCode(length: number) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
    counter++;
  }
  return result;
}

export function snakeCaseToTitleCase(snakeCase: string) {
  return snakeCase
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const timeEstimateStringToMinutes = (timeEstimate: string): number => {
  const timeUnits: Record<string, number> = {
    w: 7 * 24 * 60, // 1 week = 7 days, 1 day = 24 hours, 1 hour = 60 minutes
    d: 24 * 60, // 1 day = 24 hours, 1 hour = 60 minutes
    h: 60, // 1 hour = 60 minutes
    m: 1, // 1 minute = 1 minute
  };

  let totalMinutes = 0;
  const regex = /(\d+)([wdhm])/g;
  let match;

  while ((match = regex.exec(timeEstimate)) !== null) {
    const value = parseInt(match[1], 10);
    const unit = match[2];

    if (timeUnits[unit]) {
      totalMinutes += value * timeUnits[unit];
    }
  }

  return totalMinutes;
};

export const minutesToTimeEstimateString = (minutes: number): string => {
  const timeUnits: [string, number][] = [
    ["w", 7 * 24 * 60],
    ["d", 24 * 60],
    ["h", 60],
    ["m", 1],
  ];

  let result = "";
  for (const [unit, value] of timeUnits) {
    if (minutes >= value) {
      const amount = Math.floor(minutes / value);
      minutes %= value;
      result += `${amount}${unit} `;
    }
  }

  return result.trim();
};
