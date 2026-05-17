import Navigation from "./navigation";
import WorkspaceSwitcher from "./workspace-switcher";
import Logo from "./logo";
import Projects from "./projects";

const Sidebar = () => {
  return (
    <aside className="h-full bg-neutral-100 dark:bg-sidebar p-4 w-full flex flex-col gap-y-4">
      <Logo />
      <div className="border-t border-border" />
      <WorkspaceSwitcher />
      <Navigation />
      <div className="border-t border-border" />
      <Projects />
    </aside>
  );
};
export default Sidebar;
