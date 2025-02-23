import Image from "next/image";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
  if (image) {
    return (
      <div
        className={cn("size-10 relative rounded-md overflow-hidden", className)}
      >
        {<Image src={`/${image}`} alt={name} fill className="object-cover" />}
      </div>
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
        {name[0]}
      </AvatarFallback>
    </Avatar>
  );
};
export default MemberAvatar;
