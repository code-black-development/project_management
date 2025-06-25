"use client";
import DottedSeparator from "@/components/dotted-separator";
import { TaskWithUser } from "@/types/types";
import { Cross, CrossIcon, PlusIcon, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Dropzone from "shadcn-dropzone";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { is } from "date-fns/locale";
import { toast } from "sonner";
import TaskAssetDisplay from "./task-asset-display";
import { useCreateAssets } from "../api/use-create-assets";
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

  //const{mutate: createAssets} = useCreateAssets();

  const onSubmit = async () => {
    const formData = new FormData();
    formData.set("taskId", task.id);

    uploadFiles.forEach((file) => {
      formData.append("files", file);
    });

    console.log("formData", formData.get("files"));
    try {
      const response = await fetch("/api/tasks/assets", {
        method: "POST",
        body: formData,
      });
      toast.success("Assets uploaded successfully");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task"], data: task.id });
      setUploadFiles([]);
      setUploadVisible(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload assets");
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <p className="tetx-lg font-semibold">Assets</p>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setUploadVisible((prev) => !prev)}
        >
          {!uploadVisible ? (
            <PlusIcon className="size-4 mr-2" />
          ) : (
            <TrashIcon className="size-4 mr-2" />
          )}
        </Button>
      </div>
      <DottedSeparator className="my-4" />
      <div className="flex items-start flex-wrap justify-between gap-4 my-4">
        {task.assets &&
          task.assets.map((asset) => (
            <TaskAssetDisplay key={asset.id} taskAsset={asset} />
          ))}
      </div>
      <div
        className={cn("h-[400px]", {
          hidden: !uploadVisible,
        })}
      >
        <Dropzone
          onDrop={(acceptedFiles: File[]) => {
            setUploadFiles((prev) => [...prev, ...acceptedFiles]);
          }}
        />
        {uploadFiles.map((file) => (
          <img src={URL.createObjectURL(file)} alt="" className="w-[50px]" />
        ))}
        <div className="flex items-center justify-end">
          <Button onClick={onSubmit} className="ml-auto mt-4">
            upload
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TaskAssets;
