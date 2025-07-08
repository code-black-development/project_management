import prisma from "./prisma";
import bcrypt from "bcrypt";

const users = [
  { email: "tony@codeblack.digital", password: "T0pc4txx" },
  { email: "jac@codeblack.digital", password: "jacjacjac" },
];

async function main() {
  try {
    users.map(async (user) => {
      await prisma.user.create({
        data: {
          email: user.email,
          password: await bcrypt.hash(user.password, 10),
        },
      });
      console.log("👻 created user");
    });
  } catch (e) {
    console.error(e);
  }
}

main();
