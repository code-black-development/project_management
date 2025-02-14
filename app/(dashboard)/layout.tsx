import Navbar from "@/components/navbar";
import Sidebar from "@/components/sidebar";
import CreateProjectModal from "@/features/projects/_components/create-project-modal";
import CreateTaskModal from "@/features/tasks/_components/create-task-modal";
import CreateWorkspaceModal from "@/features/workspaces/_components/create-workspace-modal";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    // Todo: could make sidebar collapsible in which case the pl of the main tag would be 56 or 0 based on the state of the sidebar
    <div className="min-h-sctreen">
      <CreateWorkspaceModal />
      <CreateProjectModal />
      <CreateTaskModal />
      <div className="flex w-full h-full">
        <div className="fixed left-0 top-0 hidden lg:block h-full lg:w-[264px] overflow-y-auto">
          <Sidebar />
        </div>
        <div className="lg:pl-[264px] w-full">
          <div className="mx-auto max-w-screen-2xl h-full">
            <Navbar />

            <main className="h-full py-8 px-6 flex flex-col">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DashboardLayout;
