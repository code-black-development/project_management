import prisma from "./prisma";

async function main() {
  try {
    const email = "castleantony6@gmail.com";
    const password = "password";
    await prisma.user.create({ data: { email, password } });
    console.log("👻 created user");
  } catch (e) {
    console.error(e);
  }
}

main();
