import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "./prisma/prisma";
import Credentials from "next-auth/providers/credentials";
import { signInSchema } from "./features/auth/schema";
import { getUserByEmail } from "./lib/dbService/users";
import bcrypt from "bcrypt";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const { email, password } = await signInSchema.parseAsync(credentials);

        // logic to verify if the user exists
        const user = await getUserByEmail(email);

        if (
          user &&
          user.password &&
          (await bcrypt.compare(password, user.password))
        ) {
          return user;
        }

        return null;
      },
    }),
  ],
  trustHost: true,
  secret: "BkP6Zj/Z+NXVfAhrwDWF5ESA2ImFgsT8YRL+kXqxvfc=",
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub; // ✅ Add `id` from token
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id; // ✅ Store `id` in token
      }
      return token;
    },
  },
});
