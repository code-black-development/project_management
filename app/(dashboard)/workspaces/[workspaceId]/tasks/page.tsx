import { auth } from "@/auth";
import TaskViewSwitcher from "@/features/tasks/_components/task-view-switcher";
import { redirect } from "next/navigation";

const TasksPage = async () => {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }
  return (
    <div className="h-full flex flex-col">
      <TaskViewSwitcher />
    </div>
  );
};

export default TasksPage;
