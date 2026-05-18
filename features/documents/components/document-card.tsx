import { Badge } from "@/components/ui/badge";
import { FileIcon, ImageIcon, FileTextIcon, VideoIcon } from "lucide-react";
import { usePresignedUrl } from "@/hooks/use-presigned-url";
import ProjectAvatar from "@/features/projects/_components/project-avatar";
import { format } from "date-fns";

interface DocumentCardProps {
  document: {
    id: string;
    fileName: string;
    assetType: string | null;
    assetUrl: string;
    createdAt: string;
    task: {
      id: string;
      name: string;
      project: {
        id: string;
        name: string;
        image: string | null;
      } | null;
    };
  };
  onClick: () => void;
}

const DocumentCard = ({ document, onClick }: DocumentCardProps) => {
  const { presignedUrl, loading } = usePresignedUrl(document.assetUrl);

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return FileIcon;

    if (mimeType.startsWith("image/")) return ImageIcon;
    if (mimeType.startsWith("video/")) return VideoIcon;
    if (mimeType.includes("pdf") || mimeType.includes("text"))
      return FileTextIcon;

    return FileIcon;
  };

  const isImage = document.assetType?.startsWith("image/");
  const FileIconComponent = getFileIcon(document.assetType);

  return (
    <button
      type="button"
      className="w-full cursor-pointer rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent"
      onClick={onClick}
    >
      <div className="space-y-3">
        {/* Thumbnail */}
        <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
          {isImage && presignedUrl && !loading ? (
            <img
              src={presignedUrl}
              alt={document.fileName}
              className="w-full h-full object-cover"
            />
          ) : loading ? (
            <div className="w-full h-full bg-muted animate-pulse" />
          ) : (
            <FileIconComponent className="w-12 h-12 text-muted-foreground" />
          )}
        </div>

        {/* File name */}
        <div>
          <h3
            className="font-medium text-sm truncate text-foreground"
            title={document.fileName}
          >
            {document.fileName}
          </h3>
        </div>

        {/* Task and Project info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Task
            </Badge>
            <span
              className="text-xs text-muted-foreground truncate"
              title={document.task.name}
            >
              {document.task.name}
            </span>
          </div>

          {document.task.project && (
            <div className="flex items-center gap-2">
              <ProjectAvatar
                image={document.task.project.image || undefined}
                name={document.task.project.name}
                className="size-4"
              />
              <span
                className="text-xs text-muted-foreground truncate"
                title={document.task.project.name}
              >
                {document.task.project.name}
              </span>
            </div>
          )}
        </div>

        {/* Upload date */}
        <div className="text-xs text-muted-foreground">
          {format(new Date(document.createdAt), "MMM d, yyyy")}
        </div>
      </div>
    </button>
  );
};

export default DocumentCard;
