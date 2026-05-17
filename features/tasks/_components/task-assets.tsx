"use client";

import { TaskWithUser } from "@/types/types";
import { PlusIcon, XIcon, PaperclipIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Dropzone from "shadcn-dropzone";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import TaskAssetDisplay from "./task-asset-display";
import { useQueryClient } from "@tanstack/react-query";

interface TaskAssetsProps {
  task: TaskWithUser;
}

export type TaskAssetFile = {
  name: string;
  file: string;
  type: string;
};

const TaskAssets = ({ task }: TaskAssetsProps) => {
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadVisible, setUploadVisible] = useState(false);
  const queryClient = useQueryClient();

  const hasAssets = task.assets && task.assets.length > 0;

  const onSubmit = async () => {
    const formData = new FormData();
    formData.set("taskId", task.id);
    uploadFiles.forEach((file) => formData.append("files", file));

    try {
      await fetch("/api/tasks/assets", { method: "POST", body: formData });
      toast.success("Assets uploaded successfully");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task"], data: task.id });
      setUploadFiles([]);
      setUploadVisible(false);
    } catch (error) {
      toast.error("Failed to upload assets");
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
        <p className="text-sm font-semibold text-foreground">
          Assets
          {hasAssets && (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              {task.assets.length}
            </span>
          )}
        </p>
        <Button
          size="sm"
          variant="muted"
          onClick={() => setUploadVisible((prev) => !prev)}
        >
          {uploadVisible ? (
            <>
              <XIcon className="size-3.5 mr-1.5" />
              Cancel
            </>
          ) : (
            <>
              <PlusIcon className="size-3.5 mr-1.5" />
              Add asset
            </>
          )}
        </Button>
      </div>

      {hasAssets && (
        <div className="flex items-start flex-wrap gap-3 mb-4">
          {task.assets.map((asset) => (
            <TaskAssetDisplay key={asset.id} taskAsset={asset} />
          ))}
        </div>
      )}

      {!hasAssets && !uploadVisible && (
        <div className="flex flex-col items-center justify-center gap-y-1.5 py-6 text-center">
          <PaperclipIcon className="size-7 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">No assets attached</p>
          <p className="text-xs text-muted-foreground/70">
            Upload files, images, or documents related to this task.
          </p>
        </div>
      )}

      <div className={cn({ hidden: !uploadVisible })}>
        <div className="h-[200px]">
          <Dropzone
            onDrop={(acceptedFiles: File[]) => {
              setUploadFiles((prev) => [...prev, ...acceptedFiles]);
            }}
          />
        </div>
        {uploadFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {uploadFiles.map((file) => (
              <img
                key={file.name}
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="w-12 h-12 object-cover rounded-md border border-border"
              />
            ))}
          </div>
        )}
        {uploadFiles.length > 0 && (
          <div className="flex justify-end mt-3">
            <Button size="sm" onClick={onSubmit}>
              Upload {uploadFiles.length} file{uploadFiles.length !== 1 ? "s" : ""}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskAssets;
