"use client";
import { cn } from "@/lib/utils";
import {
  SettingsIcon,
  UsersIcon,
  BarChart3Icon,
  FileTextIcon,
} from "lucide-react";
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
    icon: FileTextIcon,
    activeIcon: FileTextIcon,
    label: "Documents",
    href: "/documents",
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
                  "bg-white shadow-sm hover:opacity-100 text-primary dark:bg-neutral-800/50 dark:border-l-2 dark:border-blue-500 dark:text-blue-400"
              )}
            >
              <Icon className={cn("size-5 text-neutral-500", isActive && "dark:text-blue-400")} />
              {route.label}
            </div>
          </Link>
        );
      })}
    </ul>
  );
};
export default Navigation;
