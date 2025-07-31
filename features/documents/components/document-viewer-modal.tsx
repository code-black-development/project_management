import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";
import { usePresignedUrl } from "@/hooks/use-presigned-url";
import ProjectAvatar from "@/features/projects/_components/project-avatar";
import { format } from "date-fns";

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  } | null;
}

const DocumentViewerModal = ({ isOpen, onClose, document }: DocumentViewerModalProps) => {
  const { presignedUrl, loading } = usePresignedUrl(document?.assetUrl);

  if (!document) return null;

  const isImage = document.assetType?.startsWith("image/");
  const isPDF = document.assetType === "application/pdf";
  const isVideo = document.assetType?.startsWith("video/");

  const handleDownload = () => {
    if (presignedUrl) {
      const link = window.document.createElement("a");
      link.href = presignedUrl;
      link.download = document.fileName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  };

  const handleOpenInNewTab = () => {
    if (presignedUrl) {
      window.open(presignedUrl, "_blank");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>{document.fileName}</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={!presignedUrl}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenInNewTab}
                  disabled={!presignedUrl}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open
                </Button>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Document info */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 border-b pb-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Task</Badge>
            <span>{document.task.name}</span>
          </div>
          
          {document.task.project && (
            <div className="flex items-center gap-2">
              <ProjectAvatar
                image={document.task.project.image || undefined}
                name={document.task.project.name}
                className="size-4"
              />
              <span>{document.task.project.name}</span>
            </div>
          )}
          
          <div>
            Uploaded: {format(new Date(document.createdAt), "MMM d, yyyy 'at' h:mm a")}
          </div>
        </div>

        {/* Document viewer */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : presignedUrl ? (
            <div className="w-full h-full min-h-[400px]">
              {isImage ? (
                <img
                  src={presignedUrl}
                  alt={document.fileName}
                  className="w-full h-auto max-h-full object-contain"
                />
              ) : isPDF ? (
                <iframe
                  src={presignedUrl}
                  className="w-full h-full min-h-[500px]"
                  title={document.fileName}
                />
              ) : isVideo ? (
                <video
                  src={presignedUrl}
                  controls
                  className="w-full h-auto max-h-full"
                >
                  Your browser does not support video playback.
                </video>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                  <p className="mb-4">Preview not available for this file type.</p>
                  <div className="flex gap-2">
                    <Button onClick={handleDownload}>Download to view</Button>
                    <Button variant="outline" onClick={handleOpenInNewTab}>
                      Open in new tab
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 text-gray-500">
              <p>Failed to load document</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewerModal;
