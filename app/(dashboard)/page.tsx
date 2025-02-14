import { getUser } from "@/lib/auth-functions";
import { getWorkspaceByUserId } from "@/lib/dbService/workspaces";
import { redirect } from "next/navigation";

const Page = async () => {
  const currentUser = await getUser();
  if (currentUser) {
    const workspaces = await getWorkspaceByUserId(currentUser);
    if (workspaces.length > 0) {
      redirect(`/workspaces/${workspaces[0].id}`);
    } else {
      redirect(`/workspaces/create`);
    }
  }
  return <div>Home page</div>;
};
export default Page;
