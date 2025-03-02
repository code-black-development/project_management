import { auth } from "@/auth";
import WorkspaceIdClient from "./client";
import { redirect } from "next/navigation";

const WorkspacePage = async () => {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  return <WorkspaceIdClient />;
};
export default WorkspacePage;
