import type { Metadata } from "next";
import { getWorkspaceById } from "@/lib/dbService/workspaces";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
}

interface WorkspaceMetadataProps {
  params: Promise<{
    workspaceId: string;
  }>;
}

export const generateMetadata = async ({
  params,
}: WorkspaceMetadataProps): Promise<Metadata> => {
  const { workspaceId } = await params;
  const workspace = await getWorkspaceById(workspaceId);

  return {
    title: workspace?.name
      ? `${workspace.name} | fasta.work`
      : "Workspace | fasta.work",
  };
};

const WorkspaceLayout = ({ children }: WorkspaceLayoutProps) => {
  return children;
};

export default WorkspaceLayout;
