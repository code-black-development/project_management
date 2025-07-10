const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function assignCategoriesToTasks() {
  try {
    console.log("=== Getting categories ===");
    const categories = await prisma.taskCategory.findMany();
    console.log(
      "Categories:",
      categories.map((c) => `${c.name} (${c.id})`)
    );

    console.log("\n=== Getting tasks without categories ===");
    const tasks = await prisma.task.findMany({
      where: {
        categoryId: null,
      },
      select: {
        id: true,
        name: true,
      },
    });

    console.log(`Found ${tasks.length} tasks without categories`);

    if (tasks.length === 0) {
      console.log("No tasks to update");
      return;
    }

    // Assign categories randomly for testing
    const bugCategory = categories.find((c) => c.name === "Bug");
    const taskCategory = categories.find((c) => c.name === "Task");
    const epicCategory = categories.find((c) => c.name === "Epic");

    const updates = [];

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      let categoryId;

      // Assign based on task name or round-robin
      if (task.name.toLowerCase().includes("bug")) {
        categoryId = bugCategory?.id;
      } else if (task.name.toLowerCase().includes("epic")) {
        categoryId = epicCategory?.id;
      } else {
        categoryId = taskCategory?.id;
      }

      if (categoryId) {
        updates.push(
          prisma.task.update({
            where: { id: task.id },
            data: { categoryId },
          })
        );
        console.log(`Will assign ${task.name} to category ${categoryId}`);
      }
    }

    console.log("\n=== Updating tasks ===");
    await Promise.all(updates);
    console.log(`Updated ${updates.length} tasks with categories`);

    console.log("\n=== Verification ===");
    const updatedTasks = await prisma.task.findMany({
      include: {
        category: true,
      },
      take: 5,
    });

    updatedTasks.forEach((task) => {
      console.log(`Task: ${task.name}`);
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

assignCategoriesToTasks();
