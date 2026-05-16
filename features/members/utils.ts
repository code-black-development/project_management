import { format, formatDistanceToNow } from "date-fns";

export const getMemberDisplayName = (name: string | null, email: string) => {
  return name?.trim() || email;
};

export const getMemberInitials = (name: string | null, email: string) => {
  const displayName = getMemberDisplayName(name, email);
  const words = displayName.split(/\s+/).filter(Boolean);

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

export const formatOptionalDate = (
  value: Date | string | null | undefined,
  fallback: string = "Not available"
) => {
  if (!value) {
    return fallback;
  }

  return format(new Date(value), "MMM d, yyyy");
};

export const formatRelativeDate = (
  value: Date | string | null | undefined,
  fallback: string = "Never"
) => {
  if (!value) {
    return fallback;
  }

  return `${formatDistanceToNow(new Date(value), { addSuffix: true })}`;
};

export const formatMemberRole = (role: string) => {
  return role.charAt(0).toUpperCase() + role.slice(1);
};
