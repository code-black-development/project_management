import * as LucideIcons from "lucide-react";
import { LucideIcon } from "lucide-react";

interface IconProps {
  iconName: string;
  className?: string;
}

const DynamicIcon = ({ iconName, className = "size-4" }: IconProps) => {
  // Get the icon component from lucide-react
  const IconComponent = (LucideIcons as any)[iconName] as LucideIcon;

  // If icon doesn't exist, fallback to Tag icon
  if (!IconComponent) {
    const FallbackIcon = LucideIcons.Tag;
    return <FallbackIcon className={className} />;
  }

  return <IconComponent className={className} />;
};

export default DynamicIcon;
