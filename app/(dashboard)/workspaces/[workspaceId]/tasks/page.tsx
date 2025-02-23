import TaskViewSwitcher from "@/features/tasks/_components/task-view-switcher";
import { redirect } from "next/navigation";

interface TasksPageProps {}

const TasksPage = ({}: TasksPageProps) => {
  return (
    <div className="h-full flex flex-col">
      <TaskViewSwitcher />
    </div>
  );
};

export default TasksPage;
