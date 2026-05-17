"use client";

import { usePathname } from "next/navigation";
import MobileSidebar from "./mobile-sidebar";
import DarkModeSwitch from "./dark-mode-switch";
import UserButton from "@/features/auth/components/user-button";

const pathnameMap = {
  tasks: { title: "Tasks", description: "Manage all of your tasks here" },
  projects: {
    title: "My Project",
    description: "Manage your project here",
  },
  members: {
    title: "Members",
    description: "Manage all of your members here",
  },
};

const defaultMap = {
  title: "Home",
  description: "Monitor all of your projects and tasks here",
};

const Navbar = () => {
  const pathname = usePathname();
  const segment = pathname.split("/")[3];
  const isWorkspaceRoot = !segment;
  const pageInfo = isWorkspaceRoot
    ? null
    : pathnameMap[segment as keyof typeof pathnameMap] || defaultMap;

  return (
    <nav className="pt-4 px-6 flex flex-row items-center justify-between w-full">
      <div className="flex-col hidden lg:flex">
        {pageInfo && (
          <>
            <h1 className="text-2xl font-semibold">{pageInfo.title}</h1>
            <p className="text-muted-foreground">{pageInfo.description}</p>
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        <DarkModeSwitch />
        <UserButton />
      </div>
      <MobileSidebar />
    </nav>
  );
};
export default Navbar;
