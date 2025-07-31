import { AssetSafeDate } from "@/types/types";
import { File, TrashIcon } from "lucide-react";
import { useDeleteAsset } from "../api/use-delete-asset";
import { useConfirm } from "@/hooks/use-confirm";
import { usePresignedUrl } from "@/hooks/use-presigned-url";

interface TaskAssetDisplayProps {
  taskAsset: AssetSafeDate;
}

const TaskAssetDisplay = ({ taskAsset }: TaskAssetDisplayProps) => {
  const { mutate: deleteAsset } = useDeleteAsset();
  const { presignedUrl, loading } = usePresignedUrl(taskAsset.assetUrl);

  const [ConfirmDialog, confirm] = useConfirm(
    "Delete File",
    "This action cannot be undone",
    "destructive"
  );

  const handleDeleteAsset = async () => {
    const ok = await confirm();
    if (!ok) return;
    deleteAsset({ param: { assetId: taskAsset.id } });
  };

  const isImage = taskAsset.assetType?.startsWith("image/");
  const isPDF = taskAsset.assetType === "application/pdf";

  return (
    <div
      key={taskAsset.id}
      className="relative flex flex-col justify-between basis-1/3 h-36"
    >
      <ConfirmDialog />
      {isImage ? (
        loading ? (
          <div className="w-24 h-24 bg-gray-200 animate-pulse rounded" />
        ) : (
          <img
            src={presignedUrl || ''}
            alt=""
            className="w-24 h-24 cursor-pointer hover:opacity-50 object-cover rounded"
            onClick={() => {}}
          />
        )
      ) : (
        <File className="w-24 h-24 cursor-pointer hover:opacity-50" />
      )}
      <p className="text-xs">{taskAsset.fileName}</p>
      <TrashIcon
        className="hover:opacity-50 absolute w-6 h-6 top-0 right-0 bg-red-700 cursor-pointer"
        onClick={handleDeleteAsset}
      />
    </div>
  );
};

export default TaskAssetDisplay;
