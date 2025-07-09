import prisma from "./prisma";
//import bcrypt from "bcrypt";

const users = [
  { email: "tony@codeblack.digital", password: "T0pc4txx" },
  { email: "jac@codeblack.digital", password: "jacjacjac" },
];

async function main() {
  try {
    /*  users.map(async (user) => {
      await prisma.user.create({
        data: {
          email: user.email,
          password: await bcrypt.hash(user.password, 10),
        },
      });
      console.log("� Created user:", user.email);
    }
 */
    // Create task categories

    await prisma.taskCategory.create({
      data: { name: "Bug" },
    }),
      await prisma.taskCategory.create({
        data: { name: "task" },
      }),
      await prisma.taskCategory.create({
        data: { name: "epic" },
      }),
      console.log(`📋 Created task categories`);
    console.log("🎉 Seeding completed successfully!");
  } catch (e) {
    console.error("❌ Seeding failed:", e);
    throw e;
  } finally {
    await prisma.$disconnect();
  }
}

main();
