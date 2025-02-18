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
