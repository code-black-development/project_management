import { useGetProject } from "../api/use-get-project";

export const useProjectAutoHide = (projectId?: string) => {
  const { data: project } = useGetProject({ projectId: projectId || "" });
  
  return {
    autoHideCompletedTasks: project?.autoHideCompletedTasks || false,
    isLoading: !project && !!projectId,
  };
};
