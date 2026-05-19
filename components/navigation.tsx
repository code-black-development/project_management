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
          <Link href={fullPath} key={route.href} className="block text-inherit">
            <div
              className={cn(
                "flex items-center gap-2.5 p-2.5 rounded-md font-medium transition text-neutral-600 hover:text-primary dark:text-white/55 dark:hover:text-primary",
                isActive &&
                  "bg-white shadow-sm text-primary dark:bg-primary/10 dark:border-l-2 dark:border-primary dark:text-primary dark:shadow-none"
              )}
            >
              <Icon className={cn("size-5 text-neutral-500 dark:text-white/45 transition", isActive && "text-primary dark:text-primary")} />
              {route.label}
            </div>
          </Link>
        );
      })}
    </ul>
  );
};
export default Navigation;
