"use client";
import { cn } from "@/lib/utils";
import { SettingsIcon, UsersIcon, BarChart3Icon } from "lucide-react";
import Link from "next/link";
import {
  GoCheckCircle,
  GoCheckCircleFill,
  GoHome,
  GoHomeFill,
} from "react-icons/go";

import { usePathname } from "next/navigation";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

const routes = [
  { icon: GoHome, activeIcon: GoHomeFill, label: "Home", href: "" },
  {
    icon: GoCheckCircle,
    activeIcon: GoCheckCircleFill,
    label: "My Tasks",
    href: "/tasks",
  },
  {
    icon: SettingsIcon,
    activeIcon: SettingsIcon,
    label: "Settings",
    href: "/settings",
  },
  {
    icon: UsersIcon,
    activeIcon: UsersIcon,
    label: "Members",
    href: "/members",
  },
  {
    icon: BarChart3Icon,
    activeIcon: BarChart3Icon,
    label: "Reports",
    href: "/reports",
  },
];
const Navigation = () => {
  const workspaceId = useWorkspaceId();
  const pathname = usePathname();
  return (
    <ul className="flex flex-col ">
      {routes.map((route) => {
        const fullPath = `/workspaces/${workspaceId}${route.href}`;
        const isActive = pathname === fullPath;
        const Icon = isActive ? route.activeIcon : route.icon;
        return (
          <Link href={fullPath} key={route.href}>
            <div
              className={cn(
                "flex items-center gap-2.5 p-2.5 rounded-md font-medium hover:text-primary transition text-neutral-500 dark:text-neutral-200",
                isActive &&
                  "bg-white dark:bg-neutral-600 shadow-sm hover:opacity-100 text-primary"
              )}
            >
              <Icon className="size-5 text-neutral-500" />
              {route.label}
            </div>
          </Link>
        );
      })}
    </ul>
  );
};
export default Navigation;
