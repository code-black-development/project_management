import DottedSeparator from "@/components/dotted-separator";
import Navigation from "./navigation";
import WorkspaceSwitcher from "./workspace-switcher";
import Logo from "./logo";
import Projects from "./projects";

const Sidebar = () => {
  return (
    <aside className="h-full bg-neutral-100 dark:bg-neutral-800 p-4 w-full">
      <Logo />
      <DottedSeparator className="my-4" />
      <WorkspaceSwitcher />
      <DottedSeparator className="my-4" />
      <Navigation />
      <DottedSeparator className="my-4" />
      <Projects />
    </aside>
  );
};
export default Sidebar;
