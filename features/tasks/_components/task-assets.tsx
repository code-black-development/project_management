"use client";
import DottedSeparator from "@/components/dotted-separator";
import { TaskWithUser } from "@/types/types";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Dropzone from "shadcn-dropzone";
import { useState } from "react";

interface TaskAssetsProps {
  task: TaskWithUser;
}

const TaskAssets = ({ task }: TaskAssetsProps) => {
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  console.log("files: ", uploadFiles);

  const onSubmit = async (data) => {
    type Payload = {
      files: { name: string; file: string; type: string }[] | [];
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
    if (data.upload && data.upload.length > 0) {
      const files = await Promise.all(
        data.upload.map(async (file: any) => generateDataUrl(file))
      );

      jsonPayload.files = files;
    }

    const response = await fetch("/api/email", {
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
        <Button size="sm" variant="secondary" onClick={() => open(task.id)}>
          <PlusIcon className="size-4 mr-2" />
        </Button>
      </div>
      <DottedSeparator className="my-4" />
      <div className="flex items-center justify-between gap-4"></div>
      <div className="h-[400px]">
        <Dropzone
          onDrop={(acceptedFiles: File[]) => {
            setUploadFiles((prev) => [...prev, ...acceptedFiles]);
          }}
        />
        {uploadFiles.map((file) => (
          <img src={URL.createObjectURL(file)} alt="" className="w-[50px]" />
        ))}
      </div>
    </div>
  );
};

export default TaskAssets;
