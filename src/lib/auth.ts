import { NextAuthOptions, SessionStrategy } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import prisma from "./prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Adapter } from "next-auth/adapters";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt" as SessionStrategy,
    maxAge: 10 * 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        // First login — fetch user's org and role from DB
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: {
            id: true,
            role: true,
            organizationId: true,
          },
        });

        if (dbUser) {
          token.userId = dbUser.id;
          token.role = dbUser.role;
          token.organizationId = dbUser.organizationId;
        }
      }
      return token;
    },

    async session({ session, token }: any) {
      if (token) {
        session.user.userId = token.userId;
        session.user.role = token.role;
        session.user.organizationId = token.organizationId;
      }
      return session;
    },

    async redirect({ url, baseUrl }: any) {
      if (url.startsWith(baseUrl)) return url;
      return baseUrl + "/register";
    },
  },
};