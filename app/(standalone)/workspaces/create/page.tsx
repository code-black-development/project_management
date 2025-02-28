import { auth } from "@/auth";
import WorkspaceForm from "@/features/workspaces/_components/workspace-form";
import { redirect } from "next/navigation";

const Page = async () => {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }
  return (
    <div className="w-full lg:max-w-xl">
      <WorkspaceForm />
    </div>
  );
};
export default Page;
