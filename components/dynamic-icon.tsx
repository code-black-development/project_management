import * as LucideIcons from "lucide-react";
import { LucideIcon } from "lucide-react";

interface IconProps {
  iconName: string;
  className?: string;
}

const DynamicIcon = ({ iconName, className = "size-4" }: IconProps) => {
  if (!iconName) {
    const FallbackIcon = LucideIcons.Tag;
    return <FallbackIcon className={className} />;
  }

  // Convert kebab-case or lowercase to PascalCase for Lucide icons
  const toPascalCase = (str: string) => {
    return str
      .split(/[-_\s]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("");
  };

  const pascalCaseIconName = toPascalCase(iconName);

  // Get the icon component from lucide-react
  const IconComponent = (LucideIcons as any)[pascalCaseIconName] as LucideIcon;

  // If icon doesn't exist, fallback to Tag icon
  if (!IconComponent) {
    console.warn(
      `Icon '${iconName}' (${pascalCaseIconName}) not found in Lucide icons`
    );
    const FallbackIcon = LucideIcons.Tag;
    return <FallbackIcon className={className} />;
  }

  return <IconComponent className={className} />;
};

export default DynamicIcon;
