import Image from "next/image";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePresignedUrl } from "@/hooks/use-presigned-url";

interface MemberAvatarProps {
  image?: string;
  name?: string;
  className?: string;
  fallbackClassName?: string;
}
const MemberAvatar = ({
  image,
  className,
  name = "unassigned",
  fallbackClassName,
}: MemberAvatarProps) => {
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
        className={cn("size-10 relative rounded-md overflow-hidden bg-gray-200 animate-pulse", className)}
      />
    );
  }
  return (
    <Avatar className={cn("size-5 rounded", className)}>
      <AvatarFallback
        className={cn(
          "text-neutral-600 bg-neutral-300 font-semibold text-lg uppercase rounded-lg",
          fallbackClassName
        )}
      >
        {(name && name[0]) || "U"}
      </AvatarFallback>
    </Avatar>
  );
};
export default MemberAvatar;
