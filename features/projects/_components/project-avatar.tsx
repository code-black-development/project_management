import Image from "next/image";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePresignedUrl } from "@/hooks/use-presigned-url";

interface ProjectAvatarProps {
  image?: string;
  name: string;
  className?: string;
  fallbackClassName?: string;
}
const ProjectAvatar = ({
  image,
  className,
  name,
  fallbackClassName,
}: ProjectAvatarProps) => {
  const { presignedUrl, loading } = usePresignedUrl(image);

  if (image && presignedUrl && !loading) {
    return (
      <div
        className={cn("size-5 relative rounded-md overflow-hidden", className)}
      >
        <Image src={presignedUrl} alt={name} fill className="object-cover" />
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={cn("size-5 relative rounded-md overflow-hidden bg-gray-200 animate-pulse", className)}
      />
    );
  }
  return (
    <Avatar className={cn("size-5 rounded-md", className)}>
      <AvatarFallback
        className={cn(
          "text-white bg-blue-600 font-semibold text-sm uppercase rounded-md",
          fallbackClassName
        )}
      >
        {name[0]}
      </AvatarFallback>
    </Avatar>
  );
};
export default ProjectAvatar;
