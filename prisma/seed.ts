import prisma from "./prisma";

const createCategories = async () => {};

async function main() {
  try {
    await createCategories();
    console.log("👻 created categories");
  } catch (e) {
    console.error(e);
  }
}

main();
