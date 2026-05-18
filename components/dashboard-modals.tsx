"use client";

import dynamic from "next/dynamic";

const CreateWorkspaceModal = dynamic(
  () => import("@/features/workspaces/_components/create-workspace-modal"),
  { ssr: false }
);
const CreateProjectModal = dynamic(
  () => import("@/features/projects/_components/create-project-modal"),
  { ssr: false }
);
const CreateTaskModal = dynamic(
  () => import("@/features/tasks/_components/create-task-modal"),
  { ssr: false }
);
const CreateEventModal = dynamic(
  () => import("@/features/tasks/_components/create-event-modal"),
  { ssr: false }
);
const CreateChildTaskModalWrapper = dynamic(
  () => import("@/features/tasks/_components/create-child-task-modal-wrapper"),
  { ssr: false }
);
const EditTaskModal = dynamic(
  () => import("@/features/tasks/_components/edit-task-modal"),
  { ssr: false }
);
const CreateTaskWorklogModal = dynamic(
  () => import("@/features/tasks/_components/create-task-worklog-modal"),
  { ssr: false }
);
const UserSettingsModal = dynamic(
  () => import("@/features/auth/components/user-settings-modal"),
  { ssr: false }
);

const DashboardModals = () => {
  return (
    <>
      <CreateWorkspaceModal />
      <CreateProjectModal />
      <CreateTaskModal />
      <CreateEventModal />
      <CreateChildTaskModalWrapper />
      <EditTaskModal />
      <CreateTaskWorklogModal />
      <UserSettingsModal />
    </>
  );
};

export default DashboardModals;
