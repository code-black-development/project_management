import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { Loader } from "lucide-react";
import EventForm from "./event-form";

interface EventFormWrapperProps {
  onCancel: () => void;
}

const EventFormWrapper = ({ onCancel }: EventFormWrapperProps) => {
  const workspaceId = useWorkspaceId();

  const { data: projects, isLoading: isLoadingProjects } = useGetProjects({
    workspaceId,
  });

  const { data: members, isLoading: isLoadingMembers } = useGetMembers({
    workspaceId,
  });

  const isLoading = isLoadingProjects || isLoadingMembers;

  if (isLoading) {
    return (
      <div className="w-full h-[714px] rounded-xl border border-border bg-card flex items-center justify-center">
        <Loader className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!projects || !members) {
    return null;
  }

  return (
    <EventForm
      onCancel={onCancel}
      projectOptions={projects}
      memberOptions={members.data}
    />
  );
};

export default EventFormWrapper;
