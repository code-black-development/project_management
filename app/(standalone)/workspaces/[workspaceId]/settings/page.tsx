import WorkspaceForm from "@/features/workspaces/_components/create-workspace-form";
import { getWorkspaceById } from "@/lib/dbService/workspaces";
import { redirect } from "next/navigation";

interface WorkspaceIdSettingsPageProps {
  params: {
    workspaceId: string;
  };
}
const WorkspaceIdSettingsPage = async ({
  params,
}: WorkspaceIdSettingsPageProps) => {
  const { workspaceId } = await params;
  const workspace = await getWorkspaceById(workspaceId);
  if (!workspace) {
    redirect(`/workspaces/${workspaceId}`);
  }
  return (
    <div className="w-full lg:max-w-xl">
      <WorkspaceForm initialValues={workspace} />
    </div>
  );
};
export default WorkspaceIdSettingsPage;
