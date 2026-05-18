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
        try {
          const { email, password } =
            await signInSchema.parseAsync(credentials);

          // logic to verify if the user exists
          const user = await getUserByEmail(email);

          if (!user) {
            return null;
          }

          if (!user.password) {
            return null;
          }

          const passwordMatch = await bcrypt.compare(password, user.password);

          if (passwordMatch) {
            try {
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  lastLoginAt: new Date(),
                },
              });
            } catch (error) {
              console.error("Failed to update last login timestamp:", error);
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
            };
          } else {
            return null;
          }
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
    error: "/sign-in", // Redirect errors back to sign-in page
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      // Set the user image from the token
      if (token.image && session.user) {
        session.user.image = token.image as string;
      }

      return session;
    },
    async jwt({ token, user, trigger, session }) {
      // On first sign in, copy the user data to the token
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
      }

      // Handle session updates (when user.update is called)
      if (trigger === "update" && session) {
        try {
          // Fetch the latest user data from the database
          const updatedUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { id: true, name: true, email: true, image: true },
          });

          if (updatedUser) {
            token.name = updatedUser.name;
            token.email = updatedUser.email;
            token.image = updatedUser.image;
          }
        } catch (error) {
          console.error("JWT callback database error:", error);
          // Continue with existing token data if database is unreachable
        }
      }

      return token;
    },
  },
});
