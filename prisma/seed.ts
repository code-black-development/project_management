import prisma from "./prisma";

async function main() {
  try {
    // Plans
    await prisma.plan.upsert({
      where: { name: "Starter" },
      update: {},
      create: {
        name: "Starter",
        stripePriceId: null,
        maxWorkspaces: 1,
        maxMembers: 5,
        priceMonthly: 0,
      },
    });

    await prisma.plan.upsert({
      where: { name: "Pro" },
      update: {},
      create: {
        name: "Pro",
        stripePriceId: process.env.STRIPE_PRICE_PRO ?? null,
        maxWorkspaces: 3,
        maxMembers: 10,
        priceMonthly: 1200,
      },
    });

    await prisma.plan.upsert({
      where: { name: "Unlimited" },
      update: {},
      create: {
        name: "Unlimited",
        stripePriceId: process.env.STRIPE_PRICE_UNLIMITED ?? null,
        maxWorkspaces: -1,
        maxMembers: -1,
        priceMonthly: 2500,
      },
    });

    console.log("✅ Plans seeded");

    // Task categories
    await prisma.taskCategory.upsert({
      where: { id: "cat-bug" },
      update: {},
      create: { id: "cat-bug", name: "Bug" },
    });
    await prisma.taskCategory.upsert({
      where: { id: "cat-task" },
      update: {},
      create: { id: "cat-task", name: "Task" },
    });
    await prisma.taskCategory.upsert({
      where: { id: "cat-epic" },
      update: {},
      create: { id: "cat-epic", name: "Epic" },
    });

    console.log("✅ Task categories seeded");
    console.log("🎉 Seeding completed!");
  } catch (e) {
    console.error("❌ Seeding failed:", e);
    throw e;
  } finally {
    await prisma.$disconnect();
  }
}

main();
