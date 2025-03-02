import JoinWorkspaceForm from "@/features/workspaces/_components/join-workspace-form";
import { getWorkspaceById } from "@/lib/dbService/workspaces";
import { redirect } from "next/navigation";

interface WorkspaceJoinPageProps {
  params: Promise<{
    workspaceId: string;
    inviteCode: string;
  }>;
}
const WorkspaceJoinPage = async ({ params }: WorkspaceJoinPageProps) => {
  const { workspaceId, inviteCode } = await params;
  const workspace = await getWorkspaceById(workspaceId);

  if (!workspace) {
    redirect("/");
  }

  return (
    <div className="w-full lg:max-w-xl">
      <JoinWorkspaceForm
        initialValues={{ name: workspace.name, workspaceId, inviteCode }}
      />
    </div>
  );
};
export default WorkspaceJoinPage;
