import { auth } from "@/auth";
import { getWorkspaceInvitesByUserId } from "@/lib/dbService/workspace-invites";
import { getWorkspaceByUserId } from "@/lib/dbService/workspaces";
import { redirect } from "next/navigation";

const DashboardPage = async () => {
  const session = await auth();

  if (!session?.user?.id) {
    return redirect("/sign-in");
  }

  const workspaces = await getWorkspaceByUserId(session.user.id);
  const invites = await getWorkspaceInvitesByUserId(session.user.id);

  if (workspaces.length > 0) {
    return redirect(`/workspaces/${workspaces[0].id}`);
  }
  if (invites.length > 0) {
    return redirect(
      `/workspaces/${invites[0].workspaceId}/join/${invites[0].code}`
    );
  } else {
    return redirect(`/workspaces/create`);
  }
};

export default DashboardPage;
