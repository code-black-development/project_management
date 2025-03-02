import { auth } from "@/auth";
import ProjectIdSettingsClient from "./client";
import { redirect } from "next/navigation";

const ProjectSettingsPage = async () => {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }
  return <ProjectIdSettingsClient />;
};

export default ProjectSettingsPage;
