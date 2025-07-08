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
          console.log("🔐 Auth attempt started");
          console.log("📧 Credentials received:", {
            email: credentials?.email,
            hasPassword: !!credentials?.password,
          });

          const { email, password } =
            await signInSchema.parseAsync(credentials);
          console.log("✅ Schema validation passed");

          // logic to verify if the user exists
          const user = await getUserByEmail(email);
          console.log("👤 User lookup result:", {
            found: !!user,
            hasPassword: !!user?.password,
            userId: user?.id,
          });

          if (!user) {
            console.log("❌ No user found with email:", email);
            return null;
          }

          if (!user.password) {
            console.log("❌ User has no password set");
            return null;
          }

          console.log("🔒 Comparing passwords...");
          const passwordMatch = await bcrypt.compare(password, user.password);
          console.log("🔑 Password comparison result:", passwordMatch);

          if (passwordMatch) {
            console.log("✅ Authentication successful for user:", user.id);
            return {
              id: user.id,
              email: user.email,
              name: user.name,
            };
          } else {
            console.log("❌ Password mismatch for user:", email);
            return null;
          }
        } catch (error) {
          console.error("💥 Auth error:", error);
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
