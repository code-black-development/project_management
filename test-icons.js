const LucideIcons = require("lucide-react");

// Test the icon names from the database
const iconNames = ["bug", "alarm-clock-check", "lightbulb"];

// Convert kebab-case or lowercase to PascalCase for Lucide icons
const toPascalCase = (str) => {
  return str
    .split(/[-_\s]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
};

console.log("=== Testing Icon Name Conversion ===");
iconNames.forEach((iconName) => {
  const pascalCaseIconName = toPascalCase(iconName);
  const IconComponent = LucideIcons[pascalCaseIconName];
  console.log(
    `Icon '${iconName}' -> '${pascalCaseIconName}': ${IconComponent ? "EXISTS" : "NOT FOUND"}`
  );
});

console.log("\n=== Available Lucide Icons (sample) ===");
const allIcons = Object.keys(LucideIcons);
console.log(`Total icons available: ${allIcons.length}`);

console.log("\n=== Search for similar icons ===");
iconNames.forEach((iconName) => {
  console.log(`\nSearching for icons similar to '${iconName}':`);
  const similar = allIcons
    .filter(
      (name) =>
        name.toLowerCase().includes(iconName.toLowerCase().replace("-", "")) ||
        iconName.toLowerCase().replace("-", "").includes(name.toLowerCase())
    )
    .slice(0, 5);
  console.log(similar);
});
