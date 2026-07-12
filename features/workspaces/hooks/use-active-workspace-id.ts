"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";

const LAST_WORKSPACE_ID_STORAGE_KEY = "last-workspace-id";

export const useActiveWorkspaceId = () => {
  const params = useParams();
  const routeWorkspaceId =
    typeof params.workspaceId === "string" ? params.workspaceId : null;
  const { data } = useGetWorkspaces();
  const [storedWorkspaceId, setStoredWorkspaceId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setStoredWorkspaceId(
      window.localStorage.getItem(LAST_WORKSPACE_ID_STORAGE_KEY)
    );
  }, []);

  const workspaceIds = useMemo(
    () => data?.data.map((workspace) => workspace.id) ?? [],
    [data]
  );

  const activeWorkspaceId = useMemo(() => {
    if (routeWorkspaceId) {
      return routeWorkspaceId;
    }

    if (storedWorkspaceId && workspaceIds.includes(storedWorkspaceId)) {
      return storedWorkspaceId;
    }

    return workspaceIds[0] ?? null;
  }, [routeWorkspaceId, storedWorkspaceId, workspaceIds]);

  useEffect(() => {
    if (!activeWorkspaceId || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      LAST_WORKSPACE_ID_STORAGE_KEY,
      activeWorkspaceId
    );
  }, [activeWorkspaceId]);

  return activeWorkspaceId;
};
