"use client";
import DottedSeparator from "@/components/dotted-separator";
import { TaskWithUser } from "@/types/types";
import { Cross, CrossIcon, PlusIcon, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Dropzone from "shadcn-dropzone";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { is } from "date-fns/locale";

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

  console.log("files: ", uploadFiles);

  const onSubmit = async () => {
    type Payload = {
      files: { name: string; file: string; type: string }[] | [];
      taskId?: string;
    };
    let jsonPayload: Payload = { files: [] };

    async function generateDataUrl(file: File) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            name: file.name,
            file: reader.result as string,
            type: file.type,
          });
        };
        reader.onerror = (error) => {
          console.error("Error: ", error);
          reject(error);
        };
        reader.readAsDataURL(file);
      });
    }

    if (uploadFiles && uploadFiles.length > 0) {
      const files = await Promise.all(
        uploadFiles.map(async (file: any) => generateDataUrl(file))
      );

      jsonPayload.files = files as TaskAssetFile[];
      jsonPayload.taskId = task.id;
    }

    const response = await fetch("/api/tasks/assets", {
      method: "POST",
      body: JSON.stringify(jsonPayload),
    });

    if (response.status === 200) {
      /*   reset();
      setStatus("Your message has been sent!");
    } else {
      setStatus(
        "Message failed to send. Please try again or contact us directly."
      );*/
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
      <div className="flex items-center justify-between gap-4">
        {task.assets &&
          task.assets.map((asset) => (
            <div key={asset.id} className="flex items-center gap-2">
              <img src={asset.assetUrl} alt="" className="w-12 h-12" />
            </div>
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
