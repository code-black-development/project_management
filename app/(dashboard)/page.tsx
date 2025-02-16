import { auth } from "@/auth";
import { getWorkspaceByUserId } from "@/lib/dbService/workspaces";
import { redirect } from "next/navigation";

const Page = async () => {
  const session = await auth();
  console.log("session", session);
  if (session?.user?.id) {
    const workspaces = await getWorkspaceByUserId(session?.user.id);
    if (workspaces.length > 0) {
      redirect(`/workspaces/${workspaces[0].id}`);
    } else {
      redirect(`/workspaces/create`);
    }
  } else {
    redirect("/sign-in");
  }
};
export default Page;
