import { auth } from "@/auth";
import { TaskIdClient } from "./client";
import { redirect } from "next/navigation";

const TaskIdPage = async () => {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }
  return (
    <div>
      <TaskIdClient />
    </div>
  );
};

export default TaskIdPage;
