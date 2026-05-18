import Image from "next/image";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePresignedUrl } from "@/hooks/use-presigned-url";

interface WorkspaceAvatarProps {
  image?: string;
  name: string;
  className?: string;
}
const WorkspaceAvatar = ({ image, className, name }: WorkspaceAvatarProps) => {
  const { presignedUrl, loading } = usePresignedUrl(image);

  if (image && presignedUrl && !loading) {
    return (
      <div
        className={cn("size-10 relative rounded-md overflow-hidden", className)}
      >
        <Image src={presignedUrl} alt={name} fill className="object-cover" />
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={cn(
          "size-10 relative rounded-md overflow-hidden bg-muted animate-pulse",
          className,
        )}
      />
    );
  }
  return (
    <Avatar className={cn("size-10 rounded-md", className)}>
      <AvatarFallback className="text-primary-foreground bg-primary font-semibold text-lg uppercase rounded-md">
        {name[0]}
      </AvatarFallback>
    </Avatar>
  );
};
export default WorkspaceAvatar;
