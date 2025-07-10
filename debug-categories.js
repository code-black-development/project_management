const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function debugCategories() {
  try {
    console.log("=== Checking TaskCategory table ===");
    const categories = await prisma.taskCategory.findMany();
    console.log("Categories found:", categories.length);
    categories.forEach((cat) => {
      console.log(`Category: ${cat.name}, Icon: ${cat.icon}, ID: ${cat.id}`);
    });

    console.log("\n=== Checking Tasks with categories ===");
    const tasks = await prisma.task.findMany({
      include: {
        category: true,
      },
    });

    console.log("Tasks found:", tasks.length);
    tasks.forEach((task) => {
      console.log(`Task: ${task.name}`);
      console.log(`  Category ID: ${task.categoryId}`);
      console.log(
        `  Category: ${task.category ? `${task.category.name} (icon: ${task.category.icon})` : "None"}`
      );
      console.log("---");
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCategories();
