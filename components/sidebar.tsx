import Navigation from "./navigation";
import WorkspaceSwitcher from "./workspace-switcher";
import Logo from "./logo";
import Projects from "./projects";
import DarkModeSwitch from "./dark-mode-switch";

const Sidebar = () => {
  return (
    <aside className="h-full bg-neutral-100 dark:bg-sidebar p-4 w-full flex flex-col gap-y-4">
      <Logo />
      <div className="border-t border-border" />
      <WorkspaceSwitcher />
      <Navigation />
      <div className="border-t border-border" />
      <Projects />
      <div className="mt-auto border-t border-border pt-4">
        <DarkModeSwitch />
      </div>
    </aside>
  );
};
export default Sidebar;
