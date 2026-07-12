import { AssetSafeDate } from "@/types/types";
import {
  DownloadIcon,
  ExternalLinkIcon,
  File,
  TrashIcon,
} from "lucide-react";
import { useDeleteAsset } from "../api/use-delete-asset";
import { useConfirm } from "@/hooks/use-confirm";
import { usePresignedUrl } from "@/hooks/use-presigned-url";
import { Button } from "@/components/ui/button";

interface TaskAssetDisplayProps {
  taskAsset: AssetSafeDate;
}

const TaskAssetDisplay = ({ taskAsset }: TaskAssetDisplayProps) => {
  const { mutate: deleteAsset } = useDeleteAsset();
  const { presignedUrl, loading } = usePresignedUrl(taskAsset.assetUrl);

  const [ConfirmDialog, confirm] = useConfirm(
    "Delete File",
    "This action cannot be undone",
    "destructive",
  );

  const handleDeleteAsset = async () => {
    const ok = await confirm();
    if (!ok) return;
    deleteAsset({ param: { assetId: taskAsset.id } });
  };

  const handleOpenAsset = () => {
    if (!presignedUrl) {
      return;
    }

    window.open(presignedUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownloadAsset = () => {
    if (!presignedUrl) {
      return;
    }

    const link = window.document.createElement("a");
    link.href = presignedUrl;
    link.download = taskAsset.fileName;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const isImage = taskAsset.assetType?.startsWith("image/");

  return (
    <div
      key={taskAsset.id}
      className="relative flex h-40 basis-[180px] flex-col rounded-xl border border-border bg-muted/30 p-3"
    >
      <ConfirmDialog />
      <div className="absolute right-3 top-3 flex items-center gap-1">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-7"
          onClick={handleDownloadAsset}
          disabled={!presignedUrl}
          title="Download asset"
        >
          <DownloadIcon className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-7 text-destructive hover:text-destructive"
          onClick={handleDeleteAsset}
          title="Delete asset"
        >
          <TrashIcon className="size-4" />
        </Button>
      </div>

      <button
        type="button"
        className="flex flex-1 flex-col items-start justify-between text-left"
        onClick={handleOpenAsset}
        disabled={!presignedUrl}
        title={presignedUrl ? `Open ${taskAsset.fileName}` : taskAsset.fileName}
      >
        <div className="mt-6 flex h-24 w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
          {isImage ? (
            loading ? (
              <div className="h-full w-full animate-pulse bg-muted" />
            ) : (
              <img
                src={presignedUrl || ""}
                alt={taskAsset.fileName}
                className="h-full w-full object-cover transition-opacity hover:opacity-80"
              />
            )
          ) : (
            <File className="size-12 text-muted-foreground" />
          )}
        </div>

        <div className="mt-3 flex w-full items-center gap-2">
          <p className="truncate text-xs font-medium text-foreground">
            {taskAsset.fileName}
          </p>
          <ExternalLinkIcon className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
        </div>
      </button>
    </div>
  );
};

export default TaskAssetDisplay;
