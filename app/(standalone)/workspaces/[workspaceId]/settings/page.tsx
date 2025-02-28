import { auth } from "@/auth";
import { WorkspaceIdSettingsClient } from "./client";
import { redirect } from "next/navigation";

const WorkspaceIdSettingsPage = async () => {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }
  return <WorkspaceIdSettingsClient />;
};
export default WorkspaceIdSettingsPage;
