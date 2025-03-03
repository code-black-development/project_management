import ProjectIdClient from "./client";
import { auth } from "@/auth";

const ProjectIdPage = async () => {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }
  return <ProjectIdClient />;
};

export default ProjectIdPage;
