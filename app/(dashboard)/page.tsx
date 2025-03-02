import { auth } from "@/auth";
import { getWorkspaceByUserId } from "@/lib/dbService/workspaces";
import { redirect } from "next/navigation";

const DashboardPage = async () => {
  const session = await auth();

  if (!session?.user?.id) {
    return redirect("/sign-in");
  }

  const workspaces = await getWorkspaceByUserId(session.user.id);

  if (workspaces.length > 0) {
    return redirect(`/workspaces/${workspaces[0].id}`);
  } else {
    return redirect(`/workspaces/create`);
  }
};

export default DashboardPage;
