import Navbar from "@/components/navbar";
import Sidebar from "@/components/sidebar";
import CreateProjectModal from "@/features/projects/_components/create-project-modal";
import CreateTaskModal from "@/features/tasks/_components/create-task-modal";
import CreateChildTaskModalWrapper from "@/features/tasks/_components/create-child-task-modal-wrapper";
import CreateTaskWorklogModal from "@/features/tasks/_components/create-task-worklog-modal";
import EditTaskModal from "@/features/tasks/_components/edit-task-modal";
import CreateWorkspaceModal from "@/features/workspaces/_components/create-workspace-modal";
import UserSettingsModal from "@/features/auth/components/user-settings-modal";
import { CreateChildTaskModalProvider } from "@/features/tasks/contexts/create-child-task-modal-context";

export const dynamic = "force-dynamic";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <CreateChildTaskModalProvider>
      <div className="min-h-sctreen">
        <CreateWorkspaceModal />
        <CreateProjectModal />
        <CreateTaskModal />
        <CreateChildTaskModalWrapper />
        <EditTaskModal />
        <CreateTaskWorklogModal />
        <UserSettingsModal />
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
    </CreateChildTaskModalProvider>
  );
};
export default DashboardLayout;
